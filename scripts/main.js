var featureCollections={};
var islandsCollection={};
var feature_layers = [];
var overlayFlag = 0;

$('#btn1').prop('disabled', true);
$('#btn2').prop('disabled', true);
//*********************************************************************************************
// This section is to prevent dropdown on toolbar from disappearing when the user clicks on a checkbox
$('#dem .dropdown-menu').on({
    "click":function(e){
      e.stopPropagation();
    }
});

$('#goods .dropdown-menu').on({
    "click":function(e){
      e.stopPropagation();
    }
}); 

$('#plat .dropdown-menu').on({
    "click":function(e){
      e.stopPropagation();
    }
}); 
    
//*********************************************************************************************
// This section sets up the Active Year Slider
var sliderVal = 2015; 
$(function () {
    $("#range").ionRangeSlider({
        hide_min_max: true,
        keyboard: true,
        min: 1900,
        max: 2015,
        from: 2015,
        step: 1,
        grid: true,
        onLoad: saveResult,
        onChange: saveResult
    });
});

var saveResult = function (data) {
    console.log("*****");
    console.log(data.from);
    sliderVal = data.from;
    show_cc_Shops();
};

//*********************************************************************************************
// This section sets up the map object
L.mapbox.accessToken = 'pk.eyJ1Ijoia3lnYW5kb21pIiwiYSI6ImNpaHJ5cHFxazAwMmJ2ZG01cjFxcDRuMHkifQ.nAldTCaIaaNQd6a8kxSdRA';
var loader = document.getElementById('loader');
var map = L.mapbox.map('map', null, { zoomControl:false }).setView([45.4375, 12.3385], 14);


//*********************************************************************************************
// This section is for placing a marker on the users location
map.locate({setView: false, maxZoom: 18});

// create a global var for the location layer
var locationLayer = L.layerGroup().addTo(map); 

// If the user's location has been found, place a marker at that point
function onLocationFound(e) {
    console.log("You found me!");
    var radius = e.accuracy / 2;

    // Create a marker with a popup at the location 
    var locationMarker =  L.marker(e.latlng);
        //.bindPopup("You are within " + radius + " meters from this point").openPopup();

    // Create an additional circle showing the approximate radius
    var locationRadius = L.circle(e.latlng, radius, {
        color: 'blue',
        fillColor: 'steelblue',
        fillOpacity: 0.5 
    });

    // add the marker and popup to the location layer
    locationLayer.addLayer(locationMarker);
    locationLayer.addLayer(locationRadius);
    locationMarker.bindPopup("<center><b>You are here!</b><br>Within " + radius + " meters </center>");//.openPopup();
}

// Set a listner on the map that calls onLocationFound when the user's location has been found
map.on('locationfound', onLocationFound);

// If the user's location couldn't be found, display an alert
function onLocationError(e) {
    console.log("Uh-Oh, something went wrong");
//    alert(e.message);
}

// Set a listner on the map that calls onLocationError when the user's location is unable to be found
map.on('locationerror', onLocationError);

//**********************************************************************************************
//Set up an information box for population data
//var mapInfo = L.control();
//
//mapInfo.onAdd = function (map){
//    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
//    this._div.style.maxWidth = "300px";
//    this._div.style.marginTop = "70px";
//    this.update();
//    return this._div;
//};
//
////Method that we will use to update the control based on feature properties passed
////mapInfo.update = function (props,props2) {
////    this._div.innerHTML = '<h4>General Information</h4>' +
////       (props ?
////        '<h2>CK Console Data:</h2>' + 
////        'Island Name: ' + props.Nome_Isola +
////        '<br/> Island Number: ' + props.Numero +
////        '<br/> Sestiere Code: ' + props.Superficie +
////        '<br/> Area: ' + props.Superficie + " m^2" + 
////        '<br/> Total Shops: XXXXXXX' +
////        '<br/> Total Pop: ' + props.sum_pop_11 +
////        '<br/> Pop Density: ' + props.pop_den_11
////        
////        : 'Hover over an island <br/> ' ) 
////        + (props2 ? '<h2>Island Sort Algorithm Results:</h2>' + printObject(props2) : '');
////    this._div.style.fontFamily='Kalam';
////};
////
////mapInfo.addTo(map);


//*********************************************************************************************
// This section sets up the layer controller
var check = L.control.layers({
    'Default': L.mapbox.tileLayer('mapbox.streets').addTo(map),
    'Satellite': L.mapbox.tileLayer('mapbox.streets-satellite'),
    'Grayscale': L.mapbox.tileLayer('mapbox.high-contrast'),
}, {'Current': locationLayer}).addTo(map);    
//
//check.getContainer().ondblclick = function(e){
//    if(e.stopPropagation){
//        e.stopPropagation();
//    }
//};

// Move the zoom button to bottom right so the app looks prettier
new L.Control.Zoom({ position: 'bottomright'}).addTo(map);

//*********************************************************************************************
//This section sets up the island layer and highlight capabilities
//Add base geojson to map with islands data
var islands_layer = L.geoJson(null, {
    style: Island_style,
    onEachFeature: partial(saveAndHighlight,islands_layer)
}).addTo(map);


//Method for Loading in Island Data
function getIslands(path,options){
    $.getJSON(path,function(msg){
        var layer = msg;

        for(var i=0,iLen=layer.features.length;i<iLen;i++){
            var feature = layer.features[i];
            feature.visible = true;
            islandsCollection[feature.properties.Numero] = feature;
        }
        islands_layer.addData(layer);
        if(!filter.object){
            filter.setObject(layer.features[0].properties);
            filter.minimize(filter.minimized);
        }
        if(!colorControl.object){
            colorControl.setObject(layer.features[0].properties);
            colorControl.minimize(filter.minimized);
        }
        
        if(options){
            if(options.searchInclude){
                searchControl.includeKeys(options.searchInclude);
            }
            if(options.searchExclude){
                searchControl.searchExclude(options.searchExclude);
            }
        }
        
        searchControl.refresh();
        recolorIsles();
    });
}

//Call methods for loading in Islands data
getIslands('IslesLagoon_single.geojson',{searchInclude: ['Nome_Isola','Numero']});
getIslands('IslesLagoon_multi.geojson'),{searchInclude: ['Nome_Isola','Numero']};

//Partial method, does something important
function partial(func /*, 0..n args */) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var allArguments = args.concat(Array.prototype.slice.call(arguments));
    return func.apply(this, allArguments);
  };
}

//Method for highlighting features
function highlightFeature(e) {
    var layer = e.target;
    
    // instead of updating info on one layer, an if statement can be used here to show info
    // on multiple layers. for more info, see the following:
    //http://gis.stackexchange.com/questions/68941/how-to-add-remove-legend-with-leaflet-layers-control
    if(layer.feature.properties.islands){
         //// islands stored layer.feature.properties.islands as an ARRAY
         //mapInfo.update(layer.feature.properties.data);
        mapInfo.update(layer.feature.properties.data,layer.feature.properties.islands);
    } else {
         layer.setStyle(Highlight_style(layer.feature));
         mapInfo.update(layer.feature.properties);
    }  
}

//Method for saving and highlighting features
function saveAndHighlight(parent, feature, layer) {
    setupHighlight(feature,layer);
}

//Method for resetting the highlight
function resetHighlight(e) {
        var layer = e.target;
       // console.log(e.target);
        if(!layer.feature.properties.data){
            islands_layer.resetStyle(e.target)
        }
    
        mapInfo.update();
}

//Method for setting up the highlight 
function setupHighlight(feature, layer) {
    var originalEvents = layer.on;
//    layer.on({
//        mouseover: function(e){
//            if(originalEvents.mouseover){
//                originalEvents.mouseover(e);
//            }
//            highlightFeature(e);
//        },
//        mouseout: function(e){
//            if(originalEvents.mouseout){
//                originalEvents.mouseout(e);
//            }
//            resetHighlight(e);
//        },
//        dblclick: function(e){
//            if(originalEvents.dblclick){
//                originalEvents.dblclick(e);
//            }
////            zoomToFeature(e)
//        }
//    });
}

//function zoomToFeature(e) {
//    map.fitBounds(e.target.getBounds());
//    var currentLayer = e.target;
//    overlay(currentLayer);
//}
    
//*********************************************************************************************
// This section 

//function moreInfo(targets,tag){
//    // **************************************
//    // !!!!!!!! THIS IS A TEST ONLY !!!!!!!! - I'm going to be modifying it 
//    // further as I explore making a table-generation function, setting up titles, and overall styling
//    // **************************************
//        var output = '';
//        output ='<table border="1" style="width:100%">' +
//                        '<tr>' +
//                            '<th>Name</th>' +
//                            '<th>Address</th>' +
//                            '<th>Good Sold</th>' +
//                        '</tr>';
//        targets.forEach(function(target){
//            output +=
//            '<tr>'+
//                '<td>'+ (target["2015"].name ? target["2015"].name : 'N/A') + '</td>' +
//                '<td>'+ target["2015"].address_number 
//                     +' '+ target['2015'].address_street + '</td>' +
//                '<td>'+ (target["2015"].nace_plus_descr=='undefined' ? 'N/A': target["2015"].nace_plus_descr) + '</td>' +
//            '</tr>' ;        
//
//    //                'Name: ' + (target["2015"].name ? target["2015"].name : 'N/A') + '</br>' +
//    //                 'Location: ' + target["2015"].address_number 
//    //                 +' '+ target['2015'].address_street + 
//    //                 '</br>Good sold: ' + (target["2015"].nace_plus_descr ? target["2015"].nace_plus_descr : 'N/A')
//    //                + '</br>'+'</br>';
//        });
//        output = '<center><b>'+ dictionary(tag) +'</b> ('+targets.length+' Total)</br></center>' + output;
//        return output;
//    }

//****************************************************
// Functions for loading screen
function startLoading() {
    loader.className = 'top';
}

function finishedLoading() {
    // first, toggle the class 'done', which makes the loading screen
    // fade out
    loader.className = 'done';
    setTimeout(function() {
        // then, after a half-second, add the class 'hide', which hides
        // it completely and ensures that the user can interact with the
        // map again.
        loader.className = 'hide';
    }, 1500);
    
    $('#btn1').prop('disabled', false);
    $('#btn2').prop('disabled', false);
}

//****************************************************
//This section deals with the data collected by the team for 2015

//First lets get all the checkboxes that the data can be filtered by 
var filters_dem = document.getElementById('check_dem').filters;
var filters_plat = document.getElementById('check_plat').filters;
var filters_goods = document.getElementById('check_goods').filters;

//Get data collected in 2015 from firebase
var all_shop_json;
var members_list;
var featureLayer;
var shops = {type: "FeatureCollection", features:[]};
startLoading();
$.ajax({
        dataType: 'json',
        url: "https://ckdata.firebaseio.com/data.json",
        success: function(response) {
            console.log("TURNIPS!");
            // console.log(response);
            all_shop_json = response;
            $.ajax({
                dataType: 'json',
                url: "https://ckdata.firebaseio.com/groups/MERGE%20Stores%202012.json",
                success: function(response) {
                    console.log("Im over here!");
                    // console.log(response);
//                    finishedLoading();
                    members_list = response.members;
                    for(property in all_shop_json){
                        var val_id = property;
                        if(all_shop_json.hasOwnProperty(property)&&members_list.hasOwnProperty(property)){
                            if(all_shop_json[property].hasOwnProperty('2015')) {
                                
                                var data = CKtoGeoJSON(all_shop_json[property]);
                                data['id'] = val_id ;
                                shops.features.push(data); 
                            }
                        }
                    }
                    console.log(shops);
                    showShops();
                }
            });
        }
});


//This method is where the actual filtering occurs
//And it gets called whenever a user clicks on a checkbox
function showShops() {
    //Store values to filter data by
    var list_dem_filters = [];
    var list_plat_filters = [];
    var list_goods_filters = [];
    
    //Check the checkboxes to see if any have been checked
    for (var i = 0; i < filters_dem.length; i++) {
        if (filters_dem[i].checked) list_dem_filters.push(filters_dem[i].value);
    }
    for (var i = 0; i < filters_plat.length; i++) {
        if (filters_plat[i].checked) list_plat_filters.push(filters_plat[i].value);
    }
    for (var i = 0; i < filters_goods.length; i++) {
        if (filters_goods[i].checked) list_goods_filters.push(filters_goods[i].value);
    }
    //For the first time since we cant remove a layer that hasnt been added
    if(featureLayer && map.hasLayer(featureLayer))
        map.removeLayer(featureLayer);
    
    //Filter by features here
    var filteredFeatures = shops.features.filter(function(feature){
        //If the filter lists are empty no shops should be displayed
        if(list_dem_filters.length == 0 && 
           list_goods_filters.length == 0 &&
           list_plat_filters.length == 0){
            return false;    
        }
        
        //Find the longest list of filters
        var longest = [];
        var filters = [list_dem_filters, list_plat_filters, list_goods_filters];
        for(var i = 0; i < filters.length; i++){
            if(filters[i].length > longest.length){
                longest = filters[i];
            }
        }
        
        //Loop through nonsense
        for(index in longest){
            if((list_dem_filters.length == 0 || list_dem_filters.indexOf(feature.properties['2015'].shop_type) !== -1) &&                
               (list_goods_filters.length == 0 || list_goods_filters.indexOf(feature.properties['2015'].nace_plus_descr) !== -1) &&
               (list_plat_filters.length == 0 || list_plat_filters.indexOf(feature.properties['2015'].plateatici) !== -1)){
                    return true
            }
        }
        
        return false;
    });
    
    
    //Place icons
    //getIcon(feature.properties['2015'].nace_plus_descr)
    featureLayer = L.mapbox.featureLayer(filteredFeatures, {
                pointToLayer: function(feature,latlng){
                    return new L.marker(latlng, {icon: getIcon(feature.properties['2015'].nace_plus_descr) }).bindPopup(
                        "<img style=\"width:100%\" src=\"" + feature.properties['2015'].picture_url_small + "\"/>" + 
                        "<br/> Name: " + feature.properties['2015'].name + 
                        "<br/> Address: " + feature.properties['2015'].address_number + 
                        " " + feature.properties['2015'].address_street +  
                        "<br/> Nace+ Code: " + feature.properties['2015'].nace_plus_code + 
                        "<br/> Good Sold: " + feature.properties['2015'].nace_plus_descr + 
                        "<br/> Store Type: " + feature.properties['2015'].shop_type + 
                        "<br/> Plateaici: " + feature.properties['2015'].plateatici + 
                        "<br/> Tables of two: " + feature.properties['2015'].plateatici_seats_2 +
                        "<br/> Tables of four: " + feature.properties['2015'].plateatici_seats_4 + 
                        "<br/> Notes: " + feature.properties['2015'].notes +
                        "<br/> ck_id: " + feature.id);
                }

            }).addTo(map);
};


//****************************************************
//This section deals with the data from the Chamber of Commerce
var cc_featureLayer;

//First lets get all the checkboxes that the data can be filtered by 
var filters_check_ethnic = document.getElementById('check_ethnic').filters;
var filters_check_pc = document.getElementById('check_pc').filters;
var filters_check_code = document.getElementById('check_code').filters;

//Get data from the Chamber of Commerce on firebase
var all_cc_shops;
var cc_shops = {type: "FeatureCollection", features:[]};
//startLoading();
$.ajax({
        dataType: 'json',
        url: "https://ckdata.firebaseio.com/shops.json",
        success: function(response) {
            console.log("We did it :D");
            console.log(response);
            finishedLoading();
            all_cc_shops = response;
            for(property in all_cc_shops){
                if(all_cc_shops.hasOwnProperty(property) && all_cc_shops[property].hasOwnProperty('lat') && all_cc_shops[property].hasOwnProperty('lng')){
                    if(all_cc_shops[property].lat !== null && all_cc_shops[property].lng !== null){
                        cc_shops.features.push(CKtoGeoJSON(all_cc_shops[property]));    
                    }  
                }
            }
            
            console.log("We've made it to the windows!");
            console.log(cc_shops);
            show_cc_Shops();
        }
});



//This method is where the actual filtering occurs
//And it gets called whenever a user clicks on a checkbox
function show_cc_Shops(){
    //Lets Display some Chamber of Commerce data :D
    console.log("I see you've clicked");
    console.log("Lets see what we've got here");
    console.log(document.getElementById('display').checked);
    if(document.getElementById('display').checked) {
        //Store values to filter data by
        var list_check_ethnic = [];
        var list_check_pc = [];
        var list_check_code = [];
        
        console.log("Okay onto filtration!");
        console.log("********");
        console.log(sliderVal);
        //Check the checkboxes to see if any have been checked
        for (var i = 0; i < filters_check_ethnic.length; i++) {
            if (filters_check_ethnic[i].checked) list_check_ethnic.push(filters_check_ethnic[i].value);
        }
        for (var i = 0; i < filters_check_pc.length; i++) {
            if (filters_check_pc[i].checked) list_check_pc.push(filters_check_pc[i].value);
        }
        for (var i = 0; i < filters_check_code.length; i++) {
            if (filters_check_code[i].checked) list_check_code.push(filters_check_code[i].value);
        }
        
        
        //For the first time since we cant remove a layer that hasnt been added
        if(cc_featureLayer && map.hasLayer(cc_featureLayer))
            map.removeLayer(cc_featureLayer);
        
        //Filter by features here
        var cc_filteredFeatures = cc_shops.features.filter(function(feature){
            //If the shop is active during the given year
            if((feature.properties.year_born !== "--" ) && 
                parseInt(feature.properties.year_born) <= sliderVal && 
               ((feature.properties.year_die == "--" )|| (parseInt(feature.properties.year_die) >= sliderVal))){
                //If the filter lists are all empty only shops from the given year are displayed
                if(list_check_ethnic.length == 0 && 
                   list_check_pc.length == 0 &&
                   list_check_code.length == 0){
                    return true; 
                }
                
                //Else find the longest list of filters
                var longest = [];
                var filters = [list_check_ethnic, list_check_pc, list_check_code];
                for(var i = 0; i < filters.length; i++){
                    if(filters[i].length > longest.length){
                        longest = filters[i];
                    }
                }
                
                //And Loop through to remove shops that dont meet the criteria
                for(index in longest){
                    if((list_check_ethnic.length == 0 || list_check_ethnic.indexOf(feature.properties.persona_nascita) !== -1) &&                
                       (list_check_pc.length == 0 || list_check_pc.indexOf(feature.properties.persona_fisica) !== -1) &&
                       (list_check_code.length == 0 || checkEconomicCode(list_check_code, feature.properties.codici_attivita))){
                            //If one exists return true
                            return true
                    }
                }
                //Else return false shop didnt meet criteria
                return false;  
            } else {
                //The shop was not active during the given year
                return false;
            }
        });
        
        //Place Icons on map
        cc_featureLayer = L.mapbox.featureLayer(cc_filteredFeatures, {
            pointToLayer: function(feature,latlng){
                return L.circle(latlng, 5, {
                            color: 'red',
                            fillColor: '#f03',
                            fillOpacity: 0.5 
                        })
                .bindPopup(
                    //THINGS TO GO IN POPUP HERE!
                    "Shop Name: " + feature.properties.denominazione + 
                    "<br/> Address: " + feature.properties.indirizzo + 
                    "<br/> Sestiere: " + feature.properties.cod_sestiere +
                    "<br/> Physical Person: " + feature.properties.persona_fisica +
                    "<br/> Male/Female: " + feature.properties.persona_mf +
                    "<br/> Place of Birth: " + feature.properties.persona_nascita +
                    "<br/> Year of Shop Foundation: " + feature.properties.year_born +
                    "<br/> Year of Shop Closing: " + feature.properties.year_die +
                    "<br/> Economic Code: " + feature.properties.attivita +
                    "<br/> Economic Activity: " + feature.properties.codici_attivita);
            }
        }).addTo(map);    
    } else if(document.getElementById('hide').checked) {
        //Hide everything!
        if(cc_featureLayer && map.hasLayer(cc_featureLayer))
            map.removeLayer(cc_featureLayer);
    }
}

function checkEconomicCode(list, code){
    for(index in list){
        if(code !== undefined && code.indexOf(list[index]) !== -1){
            return true;
        }
    }
    
    return false;
}

//****************************************************
//This section deals with the icons to display
//Here the code determines which icon to use based on demographics and good sold
function getIcon(good_sold){
    
    switch(good_sold){
            case 'Closed':
                return closedIcon;
            case 'Souvenirs':
                return souvenirsIcon;
            case 'Gelateria':
                return gelateriaIcon;
            case 'Bakery':
                return bakeryIcon;
            case 'Restaurant':
                return restaurantIcon;
            case 'Tobacco':
                return tobaccoStoreIcon;
            case 'Hotel':
                return hotelIcon;
            case 'Grocery Store':
                return groceryStoreIcon;
            case 'Pharmacy':
                return pharmacyIcon;
            case 'Bank':
                return bankIcon;
            case 'Leather Goods':
                return leatherGoodsIcon;
            case 'Art':
                return artIcon;
            case 'Pizzeria':
                return pizzeriaIcon;
            case 'Jewelry':
                return jewelryIcon;
            case 'Clothing':
                return clothingIcon;
            case 'Bars':
                return barIcon;
            case 'Optical Store':
                return opticalStoreIcon;
            case 'Electronics':
                return electronicsIcon;
            case 'Shoes':
                return shoesIcon;
            case 'Exchange':
                return exchangeIcon;
            case 'Hotel with Restaurants':
                return hotelWithRestaurantIcon;
            case 'Bed and Breakfast':
                return bedAndBreakfastIcon;
            case 'Boat Supplies':
                return boatSuppliesIcon;
            case 'Travel Agency':
                return travelAgencyIcon;
            case 'Office Supplies':
                return officeSuppliesIcon;
            case 'Hair Salon':
                return hairSalonIcon;
            case 'Household Goods':
                return householdGoodsIcon;
            case 'Books':
                return booksIcon;
            case 'Affitacamere':
                return affitacamereIcon;
            case 'Real Estate':
                return realEstateIcon;
            case 'Fitness':
                return fitnessIcon;
            case 'Wine':
                return wineIcon;
            case 'Butcher':
                return butcherIcon;
            case 'Antiques':
                return antiquesIcon;
            case 'Masseuse':
                return masseuseIcon;
            case 'General Store':
                return generalStoreIcon;
            case 'Produce':
                return produceIcon;
            case 'Textile':
                return texttileIcon;
            case 'Florist':
                return floristIcon;
            case 'Hardware Store':
                return hardwareStoreIcon;
            case 'Toys':
                return toysIcon;
            case 'Photo Store':
                return photoStoreIcon;
            case 'Accessories':
                return accessoriesIcon;
            case 'Dry Cleaner':
                return dryCleanerIcon;
            case 'Tailor':
                return tailorIcon;
            case 'Appartment Rental':
                return appartmentRentalIcon;
            case 'Wood Work':
                return woodWorkIcon;
            case 'Hostel':
                return hostelIcon;
            case 'Fish':
                return fishIcon;
            case 'Other Recreational Activites':
                return otherRecreationalActivitiesIcon;
            case 'Pet Store':
                return petStoreIcon;
            case 'Cosmetics':
                return cosmeticsIcon;
            case 'Perfume':
                return perfumeIcon;
            case 'Undergarments':
                return undergarmentsIcon;
            case 'Wedding':
                return weddingIcon;
            case 'Metal Work':
                return metalWorkIcon;
            case 'Repair':
                return repairIcon;
            case 'Coffee':
                return coffeeIcon;
            case 'Furniture':
                return furnitureIcon;
            case 'Candy':
                return candyIcon;
            case 'Dairy':
                return dairyIcon;
            case 'Funeral Services':
                return funeralServicesIcon;
            case 'Nail Salon':
                return nailSalonIcon;
            case 'Funeral Goods':
                return funeralGoodsIcon;
            case 'Graphic Design':
                return graphicDesignIcon;
            case 'Stationery':
                return stationeryIcon;
            case 'Tattoo and Piercing':
                return tattooAndPiercingIcon;
            case 'Costumes':
                return costumesIcon;
            case 'Knives':
                return knivesIcon;
            case 'Medical Goods':
                return medicalGoodsIcon;
            case 'Delivery':
                return deliveryIcon;
            case 'Spa':
                return spaIcon;
            case 'Photographer':
                return photographerIcon;
            case 'Entertainment':
                return entertainmentIcon;
            case 'Liquor':
                return liquorIcon;
            case 'Sporting Goods':
                return sportingGoodsIcon;
            case 'Computer Services':
                return computerServicesIcon;
            case 'Photocopy':
                return photocopyIcon;
            case 'Luxury':
                return luxuryIcon;
            case 'Laundromat':
                return laundromatIcon;
            case 'Money Transfer':
                return moneyTransferIcon;
            case 'Car Rental':
                return carRentalIcon;
            case 'Transportation':
                return transportationIcon;
            case 'Coins and Stamps':
                return coinsAndStampsIcon;
            case 'Gloves':
                return glovesIcon;
            case 'Hotel without Restaurants':
                return hotelWithoutRestaurantIcon;
            case 'Computers':
                return computersIcon;
            case 'Musical Instruments':
                return musicalInstrumentsIcon;
            default:
                return storeIcon;
    } 
}