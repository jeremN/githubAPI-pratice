$(document).ready(function(){


	/*SEARCH*/
	$("#searchForm").on("submit", function(e){

		e.preventDefault();

		var searchTerm = $("#term").val();
	    var repo, auth, authid, token, issueurl, curl, owner;


		clearField("#user-repos li, h5, h4,#open-issue p, #user-name img, #user-name a, #user-name h3, #results p");
		clearCanvas();

		/*GET FUNCTIONS*/

		//get user
		function getUserData(callback){
			$.get("https://api.github.com/users/" + searchTerm,
				function(data, status){
					success: callback(data, status);
				}
			)
			.fail(function(){
				var failMsg = "<h5>" + searchTerm + "&nbsp; not found" + "</h5>";
				$("#search-fail").append(failMsg);
			});
		};
		
		//get user repo
		function getUserRepo(callback){
			$.get("https://api.github.com/users/" + searchTerm + "/repos",
				function(data, status){
					success: callback(data, status);
				}
			);
		};

		//get repo commit
		function getRepoCommit(callback, repo){
			$.get("https://api.github.com/repos/" + searchTerm + "/" + repo + "/commits",
				function(data, status){
					success: callback(data, status);
				}
			);
		};

		//get repo contributor
		function getRepoContributor(callback, repo){
			$.get("https://api.github.com/repos/" + searchTerm +"/" + repo + "/stats/contributors",
				function(data, status){
					success: callback(data, status);
				}
			)
			.fail(function(){
				var failMsg = "<h5>" + "Contributor not found" + "</h5>";
				$("#contrib-fail").append(failMsg);
			});

		};

		//get repo issue
		function getRepoIssue(callback, repo){
			$.get("https://api.github.com/repos/" + searchTerm + "/" + repo + "/issues",
				function(data, status){
					success: callback(data, status);
				}
			)
			.fail(function(){
				var failMsg = "<h5>" + "No open issue" + "</h5>";
				$("#issue-fail").append(failMsg);
			});
		};
		/*GET FUNCTIONS END*/


		/*SHOW FUNCTIONS*/

		//callback show user
		function showUser(data, status){
			$("#user-name").append("<div class='list-group-item'><img src=" + data.avatar_url + " height=80px' width='80px'/><div>", 
									"<h3 class='list-group-item'>" + data.login + "</h3>", 
									"<a class='list-group-item' href="+ data.html_url+">See profil on Github</a>" 
									);
		};

		//callback show user repo
		function showUserRepo(data, status){
			for (i = 0; i < data.length; i++) {
				$("#user-repos").append("<li id='repo" + i + "' class='list-group-item'>" + data[i].name + "</li>");
				repo = data[i].name;
			};

			$("#user-repos").children().on("click", function(){

					// get the chosen repo id by reference to the id element that was clicked
					var repoChoice = $("#" + this.id).html();
					repo = repoChoice;

					//clear field each time we select a repo
					clearField("#open-issue h4, #open-issue h5, #open-issue p");
					
					// call the repo function to get data for chosen repo
					getRepoContributor(showContrib, repo);
					getRepoIssue(showRepoIssue, repo);
					//$("#submit-issue, #issue").show();
				});
		};

		//callback show repo contributors
		function showContrib(data, status, repo){

			//setup empty array variable for d3
			var dataset = [];

			//loop to get all the values
			for (i = 0; i < data.length; i++) {

				//push value into dataset array for d3
				dataset.push([data[i].author.login, data[i].total]);					
			}

			/**Update the d3 chart**/
			//xScale
			xScale.domain(dataset.map(function(d) { return d[0]; }))
					.rangeRoundBands([margin.left, w], 0.05);
			//yScale
			yScale.domain([0, d3.max(dataset, function(d) { return d[1]; })])
					.range([h, margin.top]);

			//xAxis
			xAxis.scale(xScale)
					.orient("bottom");
			//yAxis
			yAxis.scale(yScale)
					.orient("left");

			//Bars & labels
			svg.selectAll("rect")
				.data(dataset)
				.enter()
					.append("rect")
						.attr("class", "bars")
						.attr("x", function(d, i) { return xScale(d[0]); })
						.attr("y", function(d) { return yScale(d[1]); })
						.attr("width", xScale.rangeBand())
						.attr("height", function(d) { return h - yScale(d[1]); })
						.attr("fill", "#45bac3")
						//Add tooltip on mouseover
						.on("mouseover",function(d){
							
							//Add blank tooltip
							svg.append("text")
								.attr("id","tooltip");

							//Get  x, y coords
							var xPosition = parseFloat(d3.select(this).attr("x")) + xScale.rangeBand()/2;
							var yPosition = parseFloat(d3.select(this).attr("y")) + 18;

							//Add tooltip
							svg.select("#tooltip")
								.attr("x",xPosition)
								.attr("y",function(d) { return yPosition - 22; })
								.attr("text-anchor","middle")
								.attr("fill","#36a9b0")
								.attr("font-family","sans-serif")
								.attr("font-size","16px")
								.text(d[1]);
						})
						.on("mouseout",function(){
							d3.select("#tooltip").remove();
						});
									

			svg.selectAll("text")
				.data(dataset);

			//remove bars
			svg.selectAll("rect")
				.data(dataset)
				.exit()
					.transition()
						.duration(500)
						.attr("x", w)
						.remove();

			//Update bars
			svg.selectAll("rect")
				.data(dataset)
				.transition()
					.duration(500)
					.attr("x", function(d, i) { return xScale(d[0]); })
					.attr("y", function(d) { return yScale(d[1]); })
					.attr("width", xScale.rangeBand())
					.attr("height", function(d) { return h -yScale(d[1]); });
					

			//Update axis & title
			svg.select(".xaxis")
				.transition()
					.duration(500)
					.call(xAxis)
						.selectAll("text")
							.style("text-anchor", "end")
							.attr("transform", "rotate(-65)");

			svg.select(".yaxis")
				.transition()
					.duration(500)
					.call(yAxis);

			svg.select(".chartTitle")
				.text(repo);

			/*Update d3 chart END*/
		};

		//callback show repo issue
		function showRepoIssue(data, status, repo){
			if (data.length === 0) {
				$("#open-issue").append("<p class='list-group-item'>0 issue</p>");
			}
			else{
				
				for (i = 0; i <data.length; i++) {
					$("#open-issue").append( "<h4 class='list-group-item'>Title:&nbsp;" + data[i].title + "</h4>", 
											 "<p class='list-group-item'>Description:&nbsp;" + data[i].body + "</p>", 
											 "<h5 class='list-group-item'>By:&nbsp;" + data[i].user.login + "</h5>"
											 );
				};
			}	
		};
		/*SHOW FUNCTIONS END*/

		//call the user fonction
		getUserData(showUser);
		getUserRepo(showUserRepo);
		//searchRepo(showRepoResult);

		//clear field
		function clearField(field){
			$(field).remove();
		}
		//clear canvas
		function clearCanvas(){
			d3.selectAll("svg").remove();
		}

		/*D3 SETUP*/
		//Define elements	
		var dataset = [];
		//var dataDesc = dataset.sort(d3.descending); //sort value by desc

		//Define width, height & margin
		var margin = {top : 70, right: 20, bottom: 60, left: 100};
		var ww = $("#chart").width(); 
		var h = 500 - margin.top - margin.bottom;
		var w = ww - margin.left - margin.right;

		//Create svg element in #chart div
		var svg = d3.select("#chart")
						.append("svg")
						.attr("width", w + margin.left + margin.right)
						.attr("height", h + margin.top + margin.bottom);

		//Define scale for x 
		var xScale = d3.scale.ordinal()
						.domain(dataset.map(function(d) { return d[0]; }) ) //domain entry
						.rangeRoundBands([margin.left, w], 0.05); //range
		
		//Define scale for y
		var yScale = d3.scale.linear()
						.domain([0, d3.max(dataset, function(d) { return d[1]; }) ])
						.range([h, margin.top]);

		//Define x axis
		var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient("bottom")
						.ticks(5); //5 marks

		//Define y axis
		var yAxis = d3.svg.axis()
							.scale(yScale)
							.orient("left");

		//Draw axis
		//Draw x axis 
		svg.append("g")
			.attr("class", "xaxis")
			.attr("transform", "translate(0," + h + ")")
			.call(xAxis)
		//Draw y axis
		svg.append("g")
			.attr("class", "yaxis")
			.attr("transform", "translate(" + margin.left + ", 0)")
			.call(yAxis);

		//Axis label
		// add the x axis label
		svg.append("text")
			.attr("class", "x axis label")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (w / 2) + "," + (h + (margin.bottom / 2) + 10) + ")")
			.text("Contributor");
		// add the y axis label
		svg.append("text")
			.attr("class", "y axis label")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(15," + (h / 2) + ")rotate(-90)")
			.text("Contributions");

		// add a title to the chart
		svg.append("text")
			.attr("class", "chartTitle")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (w / 2) + ",20)")
			.text("Repo name");


			/*
			d3 chart ressources used:
			->http://www.d3noob.org/2014/02/making-bar-chart-in-d3js.html 
			->http://alignedleft.com/tutorials
			->http://www.benlcollins.com/javascript/creating-a-dynamic-d3-visualization-from-the-github-api/ 
			*/
			/*D3 SETUP END*/

		/*POST ISSUE TO SELECTED REPO*/
		//Send data and create a token with basic authorization (see Github API for more ->https://developer.github.com/v3/)
    	$('#issueForm').on("submit", function(){

	            var username = $("#username").val();
	            var password = $("#password").val();
	            var title = $("#title").val();
	            var description = $("#description").val();

	            auth = btoa(username+':'+password);

	            $("#results p").text("Authenticating...");

	            $.ajax({ 
	                url: 'https://api.github.com/authorizations',
	                type: 'POST',
	                beforeSend: function(xhr) { 
	                    xhr.setRequestHeader("Authorization", "Basic " + auth); 
	                },
	                data: '{"scopes":["repo", "user"],"note":"Create issue with Ajax"}'
	            }).done(function(response) {
	                authid = response.id;
	                token = response.token;
	                $("#results p").text("Authenticated.");
	                postIssue(title,description);
	                delAuth();
	            }).error(function(err) {
	                $("#results p").text("Authorization Failed. Check console log.");
	                console.log(err);
	            });
    	});	
		/*POST ISSUE END*/

		//Post issue to the selected repo with title & description
	    function postIssue(title,description){

	        $("#results").text("Creating GitHub Repository.");

	        var postdata = '{"title":"'+title+'","body":"'+description+'"}';

	        $.ajax({ 
	            url: 'https://api.github.com/repos/' + searchTerm + '/' + repo + '/issues',
	            type: 'POST',
	            beforeSend: function(xhr) { 
	                xhr.setRequestHeader("Authorization", "token " + token); 
	            },
	            data: postdata
	        }).done(function(response) {
	            curl = response.contents_url;
	            issueurl = response.html_url;
	            $("#results p").text("Created Issue.");
	            //Add link to see issue on Github
		        var htmlcode = 'Finished. Check it out: <a href="'+issueurl+'">'+issueurl+'</a>';
		        $("#results").html(htmlcode);

	        }).error(function(err) {
	            $("#results p").text("Issue Creation Failed. Check console log.");
	            console.log(err);
	        });

	    }

	    //Delete authorization token
	    function delAuth(){
	        $.ajax({ 
	            url: 'https://api.github.com/authorizations/'+authid,
	            type: 'DELETE',
	            beforeSend: function(xhr) { 
	                xhr.setRequestHeader("Authorization", "Basic " + auth); 
	            }
	        });

	    }

	}); 
	/*SEARCH END*/


})
