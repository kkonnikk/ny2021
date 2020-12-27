var RENDERER = {
	TREE_PARTICLE_COUNT : 600,
	SNOW_PARTICLE_COUNT : 600,
	OFFSET_THETA : Math.PI / 60,
	BOTTOM_Y : -100,
	OFFSET_Y : 0.1,
	DELTA_OFFSET_Y : 1 / 100,
	DELTA_OFFSET_THETA : 1 / 150,
	RANGE : 150,
	TRANSFORM_COUNT : 100,
	
	init : function(){
		this.setParameters();
		this.reconstructMethods();
		this.createParticles();
		this.bindEvent();
		this.render();
	},
	setParameters : function(){
		this.$window = $(window);
		this.$container = $('#jsi-christmas-container');
		this.width = this.$container.width();
		this.height = this.$container.height();
		this.$canvas = $('<canvas />').attr({width : this.width, height : this.height}).appendTo(this.$container);
		this.context = this.$canvas.get(0).getContext('2d');
		this.particles = [];
		this.status = 0;
		this.range = this.RANGE * Math.min(this.width, this.height) / 500;
		this.transformCount = 0;
		this.gradient = this.context.createLinearGradient(0, 0, 0, this.height);
		this.gradient.addColorStop(0, 'hsl(210, 50%, 30%)');
		this.gradient.addColorStop(1, 'hsl(210, 50%, 10%)');
	},
	reconstructMethods : function(){
		this.transform = this.transform.bind(this);
		this.render = this.render.bind(this);
	},
	createParticles : function(){
		for(var i = 0, length = this.TREE_PARTICLE_COUNT, hue = 0, y = this.BOTTOM_Y, theta = 0; i < length; i++){
			var range = (0.2 + 0.8 * (this.height / 4 - y) / (this.height / 2)) * this.range,
				x = range * Math.cos(theta),
				z = range * Math.sin(theta);
				
			this.particles.push(new TREE_PARTICLE(this, hue, x, y, z));
			
			hue++;
			hue %= 360;
			theta += this.OFFSET_THETA * (1 + i * this.DELTA_OFFSET_THETA / 2);
			theta %= Math.PI * 2;
			y += this.OFFSET_Y * (1 + i * this.DELTA_OFFSET_Y);
		}
		this.particles.push(new CROWN_PARTICLE(this, 0, y, 0));
		
		for(var i = 0, length = this.SNOW_PARTICLE_COUNT; i < length; i++){
			this.particles.push(new SNOW_PARTICLE(this));
		}
	},
	bindEvent : function(){
		
	},
	transform : function(){
		switch(this.status){
		case 0:
			this.status = 1;
			this.transformCount = 0;
			this.notify();
			break;
		case 2:
			this.status = 3;
			this.transformCount = this.TRANSFORM_COUNT;
			this.notify();
		}
	},
	notify : function(){
		for(var i = 0, length = this.particles.length, status = this.status; i < length; i++){
			this.particles[i].transform(status);
		}
	},
	render : function(){
		requestAnimationFrame(this.render);
		this.context.fillStyle = this.gradient;
		this.context.fillRect(0, 0, this.width, this.height);
		
		this.particles.sort(function(particle1, particle2){
			return particle2.z - particle1.z;
		});
		for(var i = 0, length = this.particles.length, status = this.status, transformCount = this.transformCount; i < length; i++){
			this.particles[i].render(status, transformCount);
		}
		switch(this.status){
		case 1:
			if(++this.transformCount == this.TRANSFORM_COUNT){
				this.status = 2;
				this.transformCount = 0;
				this.notify();
			}
			break;
		case 2:
			if(this.transformCount < this.TRANSFORM_COUNT){
				this.transformCount++;
			}
			break;
		case 3:
			if(--this.transformCount == 0){
				this.status = 0;
				this.notify();
			}
		}
	}
};
var PARTICLE = function(methods){
	$.extend(this, methods);
};
PARTICLE.prototype = {
	FOCUS_POSITION : 200,
	RADIUS : 1,
	
	init : function(){
		this.x = this.getRandomValue(-this.renderer.width / 2, this.renderer.width / 2);
		this.y = this.getRandomValue(-this.renderer.height / 2, this.renderer.height / 2);
		this.z = this.getRandomValue(-this.FOCUS_POSITION, this.FOCUS_POSITION);
		this.vx = this.getRandomValue(-1, 1);
		this.vy = this.getRandomValue(-1, 1);
		this.vz = this.getRandomValue(-1, 1);
		this.opacity = 0;
	},
	getAxis : function(theta){
		var x = this.x,
			z = this.z;
			
		if(theta != 0){
			x = this.x * Math.cos(theta) - this.z * Math.sin(theta);
			z = this.z * Math.cos(theta) + this.x * Math.sin(theta);
		}
		var rate = this.FOCUS_POSITION / (z + this.FOCUS_POSITION);
		
		return {
			x : this.renderer.width / 2 + x * rate,
			y : this.renderer.height / 2 - this.y * rate,
			radius : Math.max(0, this.RADIUS * rate)
		};
	},
	getRandomValue : function(min, max){
		return min + (max - min) * Math.random();
	},
	isOutOfSight : function(axis){
		return axis.x < -axis.radius && this.vx < 0 || axis.x > (this.renderer.width + axis.radius) && this.vx > 0
			|| axis.y < -axis.radius && this.vy > 0 || axis.y > (this.renderer.height + axis.radius) && this.vy < 0
			|| this.z < -this.FOCUS_POSITION && this.vz < 0 || this.z > this.FOCUS_POSITION && this.vz > 0;
	}
};
var TREE_PARTICLE = function(renderer, hue, x, y, z){
	this.renderer = renderer;
	this.hue = hue;
	this.x0 = x;
	this.y0 = y;
	this.z0 = z;
	this.init();
};
TREE_PARTICLE.prototype = new PARTICLE({
	DELTA_THETA : Math.PI / 1000,
	
	transform : function(status){
		switch(status){
		case 1:
			this.vx = (this.x0 - this.x) / this.renderer.TRANSFORM_COUNT;
			this.vy = (this.y0 - this.y) / this.renderer.TRANSFORM_COUNT;
			this.vz = (this.z0 - this.z) / this.renderer.TRANSFORM_COUNT;
			break;
		case 2:
			this.x = this.x0;
			this.y = this.y0;
			this.z = this.z0;
			this.vx = 0;
			this.vy = 0;
			this.vz = 0;
			this.opacity = 1;
			this.theta = 0;
			break;
		case 3:
			this.vx = this.getRandomValue(-1, 1);
			this.vy = this.getRandomValue(-1, 1);
			this.vz = this.getRandomValue(-1, 1);
		}
	},
	render : function(status, transformCount){
		var context = this.renderer.context,
			axis = this.getAxis(status == 2 ? this.theta : 0);
		context.save();
		context.translate(axis.x, axis.y);
		context.fillStyle = 'hsla(' + this.hue + ', ' + (status <= 1 ? 0 : (60 * transformCount / this.renderer.TRANSFORM_COUNT)) + '%, ' + (20 + 60 * (this.FOCUS_POSITION - this.z) / this.renderer.height) + '%, ' + this.opacity + ')';
		context.beginPath();
		context.arc(0, 0, axis.radius, 0, Math.PI * 2, false);
		context.fill();
		context.restore();
		
		this.x += this.vx;
		this.y += this.vy;
		this.z += this.vz;
		
		switch(status){
		case 0:
			if(this.opacity < 1){
				this.opacity = Math.min(1, this.opacity + 0.01);
			}
			if(this.isOutOfSight(axis)){
				this.init();
			}
			break;
		case 2:
			this.hue += 359;
			this.hue %= 360;
			this.theta += this.DELTA_THETA;
			this.theta %= Math.PI * 2;
		}
	}
});
var SNOW_PARTICLE = function(renderer){
	this.renderer = renderer;
	this.init();
};
SNOW_PARTICLE.prototype = new PARTICLE({
	transform : function(status){
		switch(status){
		case 1:
			this.vx = this.getRandomValue(-0.3, 0.3);
			this.vy = -0.3;
			this.vz = this.getRandomValue(-0.3, 0.3);
			break;
		case 3:
			this.vx = this.getRandomValue(-1, 1);
			this.vy = this.getRandomValue(-1, 1);
			this.vz = this.getRandomValue(-1, 1);
		}
	},
	render : function(status, transformCount){
		var context = this.renderer.context,
			axis = this.getAxis(0);
		context.save();
		context.translate(axis.x, axis.y);
		context.fillStyle = 'hsla(0, 0%, ' + (20 + 60 * (this.FOCUS_POSITION - this.z) / this.renderer.height) + '%, ' + (status == 0 ? this.opacity : 1) + ')';
		context.beginPath();
		context.arc(0, 0, axis.radius, 0, Math.PI * 2, false);
		context.fill();
		context.restore();
		
		this.x += this.vx;
		this.y += this.vy;
		this.z += this.vz;
		
		switch(status){
		case 0:
			if(this.opacity < 1){
				this.opacity = Math.min(1, this.opacity + 0.01);
			}
			if(this.isOutOfSight(axis)){
				this.init();
			}
			break;
		case 2:
			if(this.isOutOfSight(axis)){
				this.x = this.getRandomValue(-this.renderer.width / 2, this.renderer.width / 2);
				this.y = this.renderer.height / 2;
				this.z = this.getRandomValue(-this.FOCUS_POSITION, this.FOCUS_POSITION);
				this.vx = this.getRandomValue(-0.3, 0.3);
				this.vy = -0.3;
				this.vz = this.getRandomValue(-0.3, 0.3);
			}
		}
	}
});
var CROWN_PARTICLE = function(renderer, x, y, z){
	this.renderer = renderer;
	this.x0 = x;
	this.y0 = y * this.renderer.height / 650 + this.RADIUS;
	this.z0 = z;
	this.init();
};
CROWN_PARTICLE.prototype = new PARTICLE({
	RADIUS : 25,
	VELOCITY : 6,
	DELTA_THETA : Math.PI / 100,
	
	init : function(){
		this.x = 0;
		this.y = -this.renderer.height;
		this.z = 0;
		this.vy = 0;
		this.theta = 0;
		this.radius = this.RADIUS * Math.min(this.renderer.width, this.renderer.height) / 500;
		this.velocity =  this.VELOCITY * this.renderer.height / 500;
		this.toRender = false;
		this.gradient = this.renderer.context.createRadialGradient(0, 0, 0, 0, 0, this.radius);
		this.gradient.addColorStop(0, 'hsl(60, 50%, 70%)');
		this.gradient.addColorStop(1, 'hsl(60, 50%, 40%)');
	},
	transform : function(status){
		switch(status){
		case 1:
			this.y = -this.renderer.height;
			this.vy = this.velocity;
			this.theta = 0;
			this.toRender = true;
			break;
		case 3:
			this.vy = this.velocity;
		}
	},
	render : function(status, transformCount){
		if(!this.toRender){
			return;
		}
		var context = this.renderer.context,
			axis = this.getAxis(0);
		context.save();
		context.translate(axis.x, axis.y);
		context.scale(Math.cos(this.theta), 1);
		context.shadowBlur = 20;
		context.shadowColor = 'hsl(60, 50%, 80%)';
		context.fillStyle = this.gradient;
		context.beginPath(Math.cos(this.theta), 1);
		
		for(var i = 0, angle = Math.PI / 5; i < 10; i++){
			var length = (i % 2 == 0) ? this.radius : this.radius * 2 / 5;
			context[i == 0 ? 'moveTo' : 'lineTo'](-length * Math.cos(Math.PI / 2 + angle * i), -length * Math.sin(Math.PI / 2 + angle * i));
		}
		context.closePath();
		context.fill();
		context.restore();
		
		switch(status){
		case 0:
		case 3:
			if(this.y >= this.renderer.height){
				this.vy = 0;
				this.toRender = false;
			}
			break;
		case 1:
		case 2:
			if(this.y >= this.y0){
				this.y = this.y0;
				this.vy = 0;
				this.theta += this.DELTA_THETA;
				this.theta %= Math.PI * 2;
			}
		}
		this.y += this.vy;
	}
});
$(function(){
	RENDERER.init();
});