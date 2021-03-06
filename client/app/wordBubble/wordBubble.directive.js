'use strict';

angular.module('realestateApp')
  .directive('wordBubble', function () {
    return {
    	restrict: 'E',
    	scope: {
    		val: '=' 
    	},
      
      link: function (scope, element, attrs) {

      	scope.$watch('val', function(data, oldData){

                // if the data is undefined, empty, or the same as the oldData - do nothing
                if (!data || data.length === 0){  
                  return;
                }
	      	
                $('#gates_tooltip').remove();

                // add a tool tip to the different word bubbles
	      	var CustomTooltip = function (tooltipId, width){
	      		var tooltipId = tooltipId;
	      		$("body").append("<div class='tooltip' id='"+tooltipId+"'></div>");

	      		
	      		if(width){
	      			$("#"+tooltipId).css("width", width);
	      		}
	      		
	      		hideTooltip();
	      		
	      		function showTooltip(content, event){
	      			$("#"+tooltipId).html(content);
	      			$("#"+tooltipId).show();
	      			
	      			updatePosition(event);
	      		}
	      		
	      		function hideTooltip(){
	      			$("#"+tooltipId).hide();
	      		}
	      		
	      		function updatePosition(event){
	      			var ttid = "#"+tooltipId;
	      			var xOffset = 20;
	      			var yOffset = 10;
	      			
	      			 var ttw = $(ttid).width();
	      			 var tth = $(ttid).height();
	      			 var wscrY = $(window).scrollTop();
	      			 var wscrX = $(window).scrollLeft();
	      			 var curX = (document.all) ? event.clientX + wscrX : event.pageX;
	      			 var curY = (document.all) ? event.clientY + wscrY : event.pageY;
	      			 var ttleft = ((curX - wscrX + xOffset*2 + ttw) > $(window).width()) ? curX - ttw - xOffset*2 : curX + xOffset;
	      			 if (ttleft < wscrX + xOffset){
	      			 	ttleft = wscrX + xOffset;
	      			 } 
	      			 var tttop = ((curY - wscrY + yOffset*2 + tth) > $(window).height()) ? curY - tth - yOffset*2 : curY + yOffset;
	      			 if (tttop < wscrY + yOffset){
	      			 	tttop = curY + yOffset;
	      			 } 
	      			 $(ttid).css('top', tttop + 'px').css('left', ttleft + 'px');
	      		}
	      		
	      		return {
	      			showTooltip: showTooltip,
	      			hideTooltip: hideTooltip,
	      			updatePosition: updatePosition
	      		}
	      	}


	      	var layout_gravity = -0.01,
	      		tooltip = CustomTooltip("gates_tooltip", 240),
	      	    	damper = 0.1,
	      	    	nodes = [],
	      	    	width = 800,
	      	    	height = 600,
	      	    	vis, force, circles, radius_scale;

      		 var max_amount = d3.max(data, function(d) { return parseInt(d.total_amount, 10); } );
      		 radius_scale = d3.scale.pow().exponent(0.5).domain([0, max_amount]).range([2, 85]);

      		 var year_centers = {
      		     "postiive": {x: width / 3, y: height / 2},
      		     "negative": {x: width / 2, y: height / 2},
      		   };


      		// create node objects from original data that will serve as the data behind each bubble in the vis, then add each node to 
                // nodes to be used later
    		     data.forEach(function(d){
    		     		var node = {
    		        		id: d.id,
					radius: radius_scale(Math.abs(parseInt(d.total_amount, 10))),
					value: d.total_amount,
					group: d.group,
					text: d.text,
					x: Math.random() * 900,
					y: Math.random() * 800
    		      	};

    		      	nodes.push(node);
    		    	});


	      	// create initial svg object, appending to body, calling it vis
      	 	var vis = d3.select('word-bubble')
	      		.append("svg")
	                		.attr("width", width)
	                		.attr("height", height)
	                		.attr("id", "svg_vis");
	      		
	      	vis.selectAll('*').remove();


	      	// set the center of the canvas
			var center = {x: width / 2, y: height / 2};	     		


			// set the fill color of each node
			var fill_color = d3.scale.ordinal()
      	                .domain(["negative", "positive"])
      	                .range(["#d84b2a", "#104E8B"]);


			// select all "circle" elements and sets them to array nodes and connects nodes via their id??
            	circles = vis.selectAll("circle")
                 		.data(nodes, function(d) { return d.id ;});      	


                 // returns all nodes that don't yet have a DOM element and appends the circle element to it
            	circles.enter()
            	 	.append("circle")
			            .attr("r", 0)
			            .attr("fill", function(d) { return fill_color(d.group) ;})
			            .attr("stroke-width", 2)
			            .attr("stroke", function(d) {return d3.rgb(fill_color(d.group)).darker();})
			            .attr("id", function(d) { return  "bubble_" + d.id; })
			            .on("mouseover", function(d, i) {show_details(d, i, this);} )
			            .on("mouseout", function(d, i) {hide_details(d, i, this);} );

			circles.transition().duration(2000).attr("r", function(d) { return d.radius; });
	 
    		    nodes.sort(function(a, b) {return b.value- a.value; });

			// sets a charge to node d
			var charge = function(d) {
			  return -(d.radius*500);
			}
			
			// .size = sets the layout size where x = width, y = height
			// .nodes = sets the array of links between nodes
			// .layout.force = positions linked nodes using physical stimulation
			var start = function() {
			  force = d3.layout.force()
			          .nodes(nodes)
			          .size([width, height]);
			}

			// sets the gravity strength and starts the nodes
			var display_group_all = function() {

			  force.gravity(layout_gravity)
			       .charge(-200)
			       .friction(0.9)
			       .on("tick", function(e) {
			          circles.each(move_towards_center(e.alpha))
			                 .attr("cx", function(d) {return d.x;})
			                 .attr("cy", function(d) {return d.y;});
			       });


			  force.start();
			 
			}
		
                // shows tool tip for the circle	
			var show_details = function (data, i, element) {
	          	   	d3.select(element).attr("stroke", "black");
	          	   	var content = "<span class=\"name\">" + data.text + "</span><br/>";
	          	   	content +="<span class=\"name\">Score:</span><span class=\"value\"> " + data.value + "</span><br/>";
	          	   	tooltip.showTooltip(content, d3.event);
          	 	}
          	 
                  // hides tool tip  
	          	 var hide_details = function (data, i, element) {
	          	   	d3.select(element).attr("stroke", function(d) { return d3.rgb(fill_color(d.group)).darker();} );
	          	   	tooltip.hideTooltip();
	          	 }


                // moves everything toward the center on start
			var move_towards_center = function (alpha) {
			  return function(d) {
			    d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
			    d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
			  };
			}

			start();
			display_group_all();
      	});

		}
	};
});

