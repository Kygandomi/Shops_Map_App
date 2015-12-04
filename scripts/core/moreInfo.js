// overlays modal-esque information box on top of the page to show all available info

// https://raventools.com/blog/create-a-modal-dialog-using-css-and-javascript/

function overlayOn(currentLayer){
    if(!overlayFlag){
        overlay(currentLayer);
    }
}
function overlayOff(currentLayer){
    if(overlayFlag){
        overlay(currentLayer);
    }
}

//TODO: make this function more flexible:
//  -to be customized in the getData() file (appearence, content, etc)
//  -be prettier?
//  -check boxesfor what appears in general info?
//  -to work with any layer (not just islands)?
//  -translate fields

// this function is called from the zoomToFeature() function
function overlay(currentLayer) {
	el = document.getElementById("overlay");
    el.style.marginTop = "70px";
	el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
    
    // toggle the state of the function flag, this affects hilighting 
    overlayFlag ^= true;

//    currentLayer.setStyle({
//        fillColor: '#FEB24C',
//        weight: 0,
//        opacity: 1,
//        color: 'white',
//        dashArray: '3',
//        fillOpacity: 1.0
//    });
    
    // if the info box is being turned off don't do any additional work
    if(!currentLayer){return;}
    
    // make life a little easier
    var properties = currentLayer.feature.properties;
    // print out whatever info you want to the 'inner' div of the 'overlay' div of index.html
    
    // currently have an issue with the scroll bar appearing on the outer div containing the map
    // instead of the info window
    document.getElementById("inner").innerHTML= '<a onclick = "overlay()" class = "Xbutton">X</a> <b><center>Island Information</center></b>'
        +' <br />';
//        + (properties ?
//        '<b>' + 'Name: ' + properties.Nome_Isola + '</b><br />' 
//        + 'Codice: ' + properties.Codice + '</b><br />'
//        + 'Island Number: ' + properties.Insula_Num + '</b><br />'
//        + '2011 Census Tract Number: ' + properties.Numero + '</b><br />'
//        + 'Total Population: ' + properties.sum_pop_11 + '</b><br />' 
//        + '<b><br />Overlays: </b>' + layerController._layers
//        :''); 
//   
    makeHTMLinfo(properties,"inner","JSON");
   
    // test for appending additional info
    $(document.getElementById("inner")).append('<br /> <br /><a href="http://www.venipedia.org/wiki/index.php?title=Islands"  target="_blank" onMouseOver="return changeImage()" onMouseOut= "return changeImageBack()"> <img name="jsbutton" src="assets/venipedia.png" width="80" height="70" border="0" alt="javascript button" align="left"></a>'  
         + '<a href="http://cartography.veniceprojectcenter.org/" target="_blank" class="button">View on a historical map</a>');
    
    // function for getting rid of overlay when you click on the screen
    // update later to remove only when clicking outside of 'overlay' div
    $(document).ready(function() {
        $('#overlay').on('dblclick', function(e) { 
            overlayOff(currentLayer);
        });
    });
    
    var myimgobj = document.images["jsbutton"];
    
};

//supporting functions for venipedia button
//http://www.javascript-coder.com/button/javascript-button-p1.phtml
function changeImage()
{
    document.images["jsbutton"].src= "assets/venipedia2.png";
    return true;
}

function changeImageBack()
{
    document.images["jsbutton"].src = "assets/venipedia.png";
    return true;
}

function makeHTMLinfo(props,id,type)
{
    switch(type){
        case("JSON"): // for geoJSONS that we've made from GIS Layers (info stored in properties)
            $(document.getElementById(id)).append(printObject(props));
            break;
        case("OVERLAY"): // for any layers that are auto-created from venipedia (info stored in properties.data)
            $(document.getElementById(id)).append(printObject(props.data));
            break; 
        default:
            $(document.getElementById(id)).append('Error - Must Specify Type <br />');
            break;
    }
}

function printObject(props,depth)
{
    depth = depth || 0;
    var output = '';

    if(!props){
        return  props + '<br />';
    }
    
    if(props.constructor === Array){
        output += "["
        if(props.length>0){
            output+=props[0];
            for(var i = 1;i<props.length;i++){
                output += ', '+props[i];
            }
        }
        output += ']<br />';
    }
    else if(typeof props === 'object'){
        //output+= tabs(depth) + '<b>'+property + '</b>: ';
        for(property in props){
            output += tabs(depth) + '<b>' + dictionary(property) + ':</b> '+printObject(props[property],depth+1);
        }
    }
    else{
        output += props + '<br />';
    }
    
    return output;
}

function tabs(int_num){
    if((!int_num)||int_num===0){
        return '';
    }
    
    var output = '';
    for(var i=0;i<int_num;i++){
        output += '&emsp;';
    }
    return output;
}

/* !!!!!!!! photograph stuff !!!!!!!!
* if we use http://instafeedjs.com/ all we need to do is sign up for an API key from 
* instagram and then showing a feed of pictures tagged by location/hashtag is super easy,
* so that could be an easy way to add photos later on if we want to use it
*/