(function () {
	var loadingPopup = "<img src='images/loader.gif' style='border:none;margin:10px;'></img><p style='color: #fff;font-size: 16px;'>Loading your comment</p>";
	var errorPopup = "<img src='images/error.png' style='height:64px;width:64px;border:none;margin:10px;'></img><p style='color: #fff;font-size: 16px;'>Sorry <br> <br> Could not load this comment</p>";

	var _comment = null;
	var _allComments = null;
	var _fileInfo = null;
	var map = null;
	
	var init = function () {
		if(isMobile()){			
			$('#btnAddToGcc, #btnGetGCCInst').addClass("forceHide");
		}
		
		blockGui(loadingPopup);
		
		$('#btnAddToGcc').click(addToGcc);
		$('h3 a').click(function(e){			
			$(e.target).parent().parent().next().slideToggle();
		});
		
		var hash = window.location.hash.substring(1).trim();
		if (hash === "") {
			console.log("No id found");
			blockGui(errorPopup);
			return;
		}

		hash = hash.substring(3);
		
		if(hash.toLowerCase().charAt(0) === "c" && hash.length === 21){
			hash = hash.substring(1);
			
			gistShare.getComment(hash).done(function (files) {
				if(files.length > 0){
					var parsedCom = parseXMLToComment(files[0]["content"]);
					if (parsedCom.length === 0) {
						console.log("Comment could not be parsed");
						blockGui(errorPopup);
						return;
					}
					
					_allComments = parsedCom;
					
					$('#commentMenueDiv').children().remove();
					
					var line = "";
					for(i=0; i<parsedCom.length; i++){
						line = parsedCom[i].name.substring(0,26) + " ("+parsedCom[i].gccode+")";
						$('<div class="voice {}"><a style="cursor: pointer;" id="menu_'+i+'" class="label">'+line+'</a> </div>').appendTo('#commentMenueDiv');
					}
					
					_fileInfo = files[0];
					
					var extr = $("#commentMenueDiv").buildMbExtruder({
						position:"right",
						width:400,
						extruderOpacity:.8,
						hidePanelsOnClose:true,
						accordionPanels:true,
						onExtOpen:function(){},
						onExtContentLoad:function(){},
						onExtClose:function(){}
					}).show();
					
					$('.voice').find('a').click(menuChangeComment);
					$('.extruder-content').children().first().addClass("menuContent");
					$('.flapLabel').next().addClass("pointer");
					
					$("#commentMenueDiv a").first().click();
					setTimeout(function(){extr.openMbExtruder(true)},500);
				}
				else{
					console.log("No data");
					blockGui(errorPopup);		
					return;
				}
			}).fail(function(error){
				console.log(error);
				blockGui(errorPopup);	
				return;
			});					
		}
		else{
			getCommentData(hash).fail(function (msg) {
				console.log(msg);
				blockGui(errorPopup);
			}).done(function (comment) {
				var parsedCom = parseXMLToComment(comment["content"]);
				if (parsedCom.length === 0) {
					console.log("Comment could not be parsed");
					blockGui(errorPopup);
					return;
				}
				_allComments = parsedCom;
				displayComment(parsedCom[0], comment);			
			});
		}
	};
	
	var menuChangeComment = function(e){
		$('.menuSelected').removeClass("menuSelected");
		var id = e.target.id.replace("menu_", "");
		$(e.target).parent().addClass("menuSelected");
		displayComment(_allComments[id], _fileInfo);			
	}

	var blockGui = function (messageHtml) {
		$('#btnAddToGcc, #btnDownloadGccFile, #btnLinkGC').block({ message: null });
		$('section').block({
			message: messageHtml,
			css: {
				color: '#232323',
				border: 'none',
				backgroundColor: '#232323',
				cursor: 'wait',
				'-webkit-border-radius': '10px',
				'-moz-border-radius': '10px'
			}
		});
	};

	var unblockGui = function () {
		$('#btnAddToGcc, #btnDownloadGccFile, #btnLinkGC, section').unblock();
	};

	var displayComment = function (c, fileInfo) {
		_comment = c;
		_fileInfo = fileInfo;
		$('#lblGcCode').text(c.gccode);
		$('#lblName').html(c.name.replace("<","") + "<br>(" + c.state.replace("-", "no state set").replace("<","") + ")");
		document.title = c.name + "(" + c.gccode + ") - GCComment viewer by lukeIam";
		$('#btnLinkGC a').attr("href", "http://coord.info/"+c.gccode);
		$('#boxComment').text(c.commentValue);
		$('#btnDownloadGccFile a').attr('href', fileInfo["raw_url"]);
		displayFinalCoordinate(c);
		displayCoordinates(c);
		displayMap(c);
		
		if(isMobile()){
			$('tr').each(function(i,e){
				$(e).children().first().hide();
			});			
		}
		
		unblockGui();
	};
	
	var displayCoordinates = function(coord){
		if(coord["waypoints"].length === 0){
			$('#finalCoordSpan').show();
			$('#boxCoords').hide();
			return;
		}
		
		$('#boxCoords tbody').children().remove();
		$('#finalCoordSpan').hide();
		$('#boxCoords').show();		
		
		for(var i=0; i<coord["waypoints"].length; i++){			
			var c = coord["waypoints"][i];
			var convCoord = convertToDD(c.coordinate);
			$("<tr><td><img style='height:16px;width:16px;' src='images/flag.png'></img></td> <td style='max-width: 170px; word-wrap: break-word;'>"+ c.name +"</td> <td><span>"+ c.coordinate +"</span><p style='margin-left: 30%;margin-bottom: 0;'> <a target='_blank' href='https://www.google.de/maps?q="+c.coordinate+"'><img src='images/gmap.png' style='height: 20px;'></img></a> <a target='_blank' href='https://www.openstreetmap.org/?mlat="+convCoord.lat+"&mlon="+convCoord.lon+"&zoom=16'><img src='images/osm.png' style='height: 20px;'></img></a> </p></td> <td>"+ c.prefix +"</td> <td>"+ c.lookup +"</td> </tr>")
			.appendTo('#boxCoords tbody')
			.filter(isMobile).find("span").wrap("<a href='geo:"+convCoord.lat+","+convCoord.lon+"'></a>");			
		}
	};
	
	var displayFinalCoordinate = function(coord){
		if(coord.lat === "" && coord.lng === ""){			
			$('#final-coordinate').html("<span id='finalCoordSpan'>No final coordinates</span>");
			return;
		}
		
		$('#final-coordinate').html("<span id='finalCoordSpan'>"+ convertToDDMM(coord.lat, coord.lng) +"</span><p style='margin-bottom: 0;'> <a target='_blank' href='https://www.google.de/maps?q="+coord.lat +" "+ coord.lng +"'><img src='images/gmap.png' style='height: 20px;'></img></a> <a target='_blank' href='https://www.openstreetmap.org/?mlat="+coord.lat+"&mlon="+coord.lng+"&zoom=16'><img src='images/osm.png' style='height: 20px;'></img></a> </p>");
		$('#finalCoordSpan').filter(isMobile).wrap("<a href='geo:"+coord.lat+","+coord.lng+"'></a>");
	};
	
	var displayMap = function(coord){	
		if(map !== null){
			map.remove();
		}
	
		map = L.map('mapDiv');
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: 'Map data &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://mapbox.com">Mapbox</a>',
			maxZoom: 18
		}).addTo(map);
		
		//Modified function from gccomment.user.js
		var bounds = new L.LatLngBounds();
		var aWaypoints = [];

		var latlngHome = null;
		
		if (coord.origlat && coord.origlng) {
			latlngHome = new L.LatLng(coord.origlat, coord.origlng);
			aWaypoints.push(latlngHome);
			var homeWaypoint = new L.Marker(latlngHome, {
					icon : new L.Icon({
						iconSize : new L.Point(16, 26),
						iconAnchor : new L.Point(13, 26),
						iconUrl : "images/marker.png"
					}),
					title : "Original coordinate",
					clickable : false
			});
			map.addLayer(homeWaypoint);
			bounds.extend(latlngHome);
		}
		
		for (var m = 0; coord.waypoints && (m < coord.waypoints.length); m++) {
			var coords = convertToDD(coord.waypoints[m].coordinate);
			if (coords.lat && coords.lon) {
				var latlngWaypoint = new L.LatLng(coords["lat"], coords["lon"]);
				var markerWaypoint = new L.Marker(latlngWaypoint, {
					icon : new L.Icon({	
						iconSize : new L.Point(22, 22),
						iconAnchor : new L.Point(20, 25),
						iconUrl : "images/flag.png"
					}),
					title : coord.waypoints[m].name,
					clickable : false
				});
				map.addLayer(markerWaypoint);
				aWaypoints.push(latlngWaypoint);
				bounds.extend(latlngWaypoint);
			}
		}

		if (coord.lat && coord.lng) {
			var latlngFinal = new L.LatLng(coord.lat, coord.lng);
			var markerFinal = new L.Marker(latlngFinal, {
				icon : new L.Icon({
					iconSize : new L.Point(22, 22),
					iconAnchor : new L.Point(20, 25),
					iconUrl : "images/finalIcon.png"
				}),
				title : "Custom final coordinate",
				clickable : false
			});
			map.addLayer(markerFinal);
			bounds.extend(latlngFinal);
			aWaypoints.push(latlngFinal);
		}
		
		// add line between waypoints
		map.addLayer(new L.Polyline(aWaypoints, {
			color : "#000000",
			weight : 1,
			clickable : false,
			opacity : 1,
			fillOpacity : 1
		}));

		map.fitBounds(bounds, {padding: [5,5]});
	};
	
	var addToGcc = function(){
		if(_comment !== null){
			window.postMessage("GCC_Share_" + JSON.stringify(_comment), "*");
		}
		else{
			alert("No data to import");
		}		
	};
	
	var getCommentData = function (id) {
		var d = new $.Deferred();
		var files = gistShare.getComment(id).done(function (files) {
			if (files.length < 1) {
				d.reject("No files found");
				return;
			}

			d.resolve(files[0]);
		}).fail(function (msg) {
			d.reject(msg);
		});

		return d.promise();
	}

	var convertToDD = function(str){
		var dataLat = str.match(/([NS]) *([0-9]+)[^0-9]*([0-9]+\.[0-9]+)/);
		var dataLon = str.match(/([WE]) *([0-9]+)[^0-9]*([0-9]+\.[0-9]+)/);
		
		return {
			lat:(parseFloat(dataLat[2])+(parseFloat(dataLat[3])/60))*(dataLat[1].trim()==="S"?-1:1),
			lon:(parseFloat(dataLon[2])+(parseFloat(dataLon[3])/60))*(dataLon[1].trim()==="W"?-1:1)
		};
	}
	
	var convertToDDMM = function(lat, lon){
		var ddLat = Math.floor(Math.abs(lat));
		var mmLat = (Math.abs(lat)-ddLat)*60;
		var ddLon = Math.floor(Math.abs(lon));
		var mmLon = (Math.abs(lon)-ddLon)*60;
		
		return (lat<0?"S":"N") + " " + ddLat + "° " +( Math.round(mmLat * 1000) / 1000) + " " 
			+ (lon<0?"W":"E") + " " + ddLon + "° " +( Math.round(mmLon * 1000) / 1000);
	};
	
	var isMobile = function(){
		return (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())) !== false;
	}
	
	//Modified version of parseXMLImport from gccomment.user.js
	var parseXMLToComment = function (xml) {
		function unescapeXML(escaped) {
			if (escaped === null || escaped === undefined) {
				return null;
			}
			var result = escaped.replace(/&gt;/g, ">");
			result = result.replace(/&lt;/g, "<");
			result = result.replace(/&quot;/g, "\"");
			result = result.replace(/&amp;/g, "&");
			result = result.replace(/&apos;/g, "'");
			// result = result.replace(/&#10;/g, "\n");
			return result;
		}

		var parser = new DOMParser();
		try {
			var xmlDoc = parser.parseFromString(xml, "text/xml");
			var comments = xmlDoc.getElementsByTagName('comment');
		} catch (e) {
			console.log("Could not parse comment xml.");
			return null;
		}

		if (comments.length <= 0) {
			console.log("No comment data found.");
			return null;
		}
		var result = [];
		for(i=0; i<comments.length; i++){		
			var commentNode = comments[i];
			try {
				var imID = commentNode.childNodes[0].childNodes[0].nodeValue;
				var imCode = "";
				if (commentNode.childNodes[1].childNodes[0])
					imCode = commentNode.childNodes[1].childNodes[0].nodeValue;
				var imName = unescapeXML(unescape(commentNode.childNodes[2].childNodes[0].nodeValue));
				var imContent = "";
				if (commentNode.childNodes[3].childNodes[0]) {
					imContent = unescapeXML(unescape(commentNode.childNodes[3].childNodes[0].nodeValue));
				}
				if ((imContent == "null") || (imContent == "undefined"))
					imContent = "";

				var imSave = commentNode.childNodes[4].childNodes[0].nodeValue;

				var imState; // new property "state" with version 40
				if (commentNode.childNodes[5])
					imState = commentNode.childNodes[5].childNodes[0].nodeValue;

				var imLat = "", imLng = ""; // new props lat, lng since v46
				if (commentNode.childNodes[6] && commentNode.childNodes[7]) {
					if (commentNode.childNodes[6].childNodes[0])
						imLat = commentNode.childNodes[6].childNodes[0].nodeValue;
					if (commentNode.childNodes[7].childNodes[0])
						imLng = commentNode.childNodes[7].childNodes[0].nodeValue;
				}

				var imOriglat = "", imOriglng = ""; // new props for orig coordinate of
				// cache
				if (commentNode.childNodes[8] && commentNode.childNodes[9]) {
					if (commentNode.childNodes[8].childNodes[0])
						imOriglat = commentNode.childNodes[8].childNodes[0].nodeValue;
					if (commentNode.childNodes[9].childNodes[0])
						imOriglng = commentNode.childNodes[9].childNodes[0].nodeValue;
				}

				var imArchived = "";
				if (commentNode.childNodes[10]) {
					if (commentNode.childNodes[10].childNodes[0])
						imArchived = commentNode.childNodes[10].childNodes[0].nodeValue;
				}

				var imWaypoints = [];
				if (commentNode.childNodes[11]) {
					for (var j = 0; j < commentNode.childNodes[11].childNodes.length; j++) {
						var Xwpt = commentNode.childNodes[11].childNodes[j];
						imWaypoints.push({
							prefix: Xwpt.childNodes[0].childNodes[0].nodeValue,
							lookup: Xwpt.childNodes[1].childNodes[0].nodeValue,
							name: Xwpt.childNodes[2].childNodes[0].nodeValue,
							coordinate: Xwpt.childNodes[3].childNodes[0].nodeValue
						});
					}
				}
			} catch (e) {
				console.log("Could not parse comment data.");
				return null;
			}

			result.push({
				guid: imID,
				gccode: imCode,
				name: imName,
				commentValue: imContent,
				saveTime: imSave,
				state: imState,
				lat: imLat,
				lng: imLng,
				origlat: imOriglat,
				origlng: imOriglng,
				archived: imArchived,
				waypoints: imWaypoints
			});
		}
		return result;
	};

	var gistShare = new function () {
		this.shareComment = function (data, gcid, name) {
			var d = new $.Deferred();

			gist.uploadNewGist(data, gcid + ".gcc", "Shared comment for \"" + name + "\" (" + gcid + ")").done(function (result) {
				if (typeof (result) !== "undefined" && typeof (result["id"]) !== "undefined") {
					d.resolve("gcc" + result["id"]);
				}
				else {
					d.reject("Creation failed");
				}
			}).fail(function (jqXHR, textStatus) {
				d.reject(textStatus + " - " + jqXHR.responseText);
			});

			return d.promise();
		};

		this.getComment = function (id) {
			var d = new $.Deferred();
			var files = [];

			gist.getGist(id).done(function (result) {
				if (typeof (result) !== "undefined" && typeof (result["files"]) !== "undefined") {
					var truncatedFilesUrls = [];

					for (f in result["files"]) {
						if (!f["truncated"]) {
							files.push(result["files"][f]);
						}
						else {
							truncatedFilesUrls.push({
								url: result["files"][f]["raw_url"],
								fileInfo: result["files"][f]
							});
						}
					}

					if (truncatedFilesUrls.length > 0) {
						var fileLoadPromises = [];
						for (urlData in truncatedFilesUrls) {
							fileLoadPromises.push(
								(function () {
									var d2 = new $.Deferred();
									$.ajax(urlData["url"], {
										cache: false,
										dataType: "text"
									}).done(function (data) {
										urlData["fileInfo"]["content"] = data;
										d2.resolve(urlData["fileInfo"]);
									}).fail(function (msg) {
										d2.reject(msg);
									});
									return d2.promise();
								})()
							);
						}

						$.when.apply($, fileLoadPromises).done(function () {
							for (var i = 0; i < arguments.length; i++) {
								files.push(arguments[i]);
							}
							d.resolve(files);
						}).fail(function () {
							if (files.length > 0) {
								d.resolve(files);
								console.log("Getting some raw gist failed");
							}
							else {
								d.reject("Getting raw gist failed");
							}
						});
					}
					else {
						d.resolve(files);
					}
				}
				else {
					d.reject("Getting gist failed");
				}
			}).fail(function (jqXHR, textStatus) {
				d.reject(textStatus + " - " + jqXHR.responseText);
			});

			return d.promise();
		};		
	};

	var gist = new function () {
		var gistApiUrl = "https://api.github.com/gists";
		this.getGist = function (id) {
			return $.ajax(gistApiUrl + "/" + id, {
				cache: false,
				dataType: "json"
			});
		};
	};


	$(document).ready(init);
})();