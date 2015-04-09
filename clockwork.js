function getWindowSize() {
    var myWidth;
    var myHeight;
    
    if( typeof( window.innerWidth ) == 'number' ) {
        //Non-IE
        myWidth = window.innerWidth;
        myHeight = window.innerHeight;
    } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
        //IE 6+ in 'standards compliant mode'
        myWidth = document.documentElement.clientWidth;
        myHeight = document.documentElement.clientHeight;
    } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
        //IE 4 compatible
        myWidth = document.body.clientWidth;
        myHeight = document.body.clientHeight;
    }
    
    return [myWidth,myHeight];
}

waitForIt = null;

function setbkg(){
    
    /* ====================================================================
    http://www.npr.org/audiohelp/progstream.html
    ==================================================================== */
    
    var paddingTop = 380; // from the TOP of the IMAGE to the BORDER of the CLOCK
    var outerHand = 20; // from the TOP of the 'outer' HAND to the BORDER of the CLOCK
    var fullHandSize = 1000; // from the TOP of the 'outer' HAND to the CENTER of the CLOCK
    
    // schedule, starting with Sunday, ex. [[pic.png,#ofdays],[pic.png,#ofdays]],
    var program = [
    [['other2014.png',2],['me2014.png',5]],
    [['other2014.png',2],['me2014.png',5]],
    [['other2014.png',2],['atc2014.png',5]],
    [['other2014.png',2],['atc2014.png',5]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',2],['atc2014.png',5]],
    [['other2014.png',2],['atc2014.png',5]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',1],['me2014.png',5],['other2014.png',1]],
    [['other2014.png',1],['me2014.png',5],['other2014.png',1]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',7]],
    [['other2014.png',1],['atc2014.png',5],['other2014.png',1]],
    [['other2014.png',1],['atc2014.png',5],['other2014.png',1]],
    ];
    
    // getting the array for this hour
    var h = moment().tz('America/New_York').get('hour');
    var thisHour = program[h];
    
    var img = null;
    
    // if this hour is not yet configured
    if (!thisHour) {
        console.error('The hour '+h+' is not configured yet.');
    } else {
        // if it is
        var dayImg = [];
        // running each position on the array for this hour of the day
        for (i in thisHour) {
            // getting the position
            var cfg = thisHour[i];
            // running for 1 to the number-of-days of this position
            for (var j = 1; j <= cfg[1]; j++) {
                // adding the image code for this day;
                dayImg.push(cfg[0]);
            }
        }
        /*
        [['code1',1],['code2',4],['code3',2]] ->
        ['code1','code2','code2','code2','code2','code3','code3']
        */
        var w = moment().tz('America/New_York').get('day');
        img = dayImg[w]; // like this
    }
    
    if (!img) img = 'i.imgur.com/wNOr5VU.png';
    
    var fakeImg = new Image();
    fakeImg.onload = function() {
        // getting the size of the window
        var winsize = getWindowSize();
        var win_w = winsize[0];
        var win_h = winsize[1];
        
        // getting the ratio of the original image
        var ratio_wh = this.width/this.height;
        var ratio_hw = this.height/this.width;
        
        // calculating the new size of the img
        var div_w = 0;
        var div_h = 0;
        if (win_w > win_h) {
            div_h = win_h-5;
            div_w = div_h*ratio_wh;
        } else {
            div_w = win_w-5;
            div_h = div_w*ratio_hw;
        }
        
        // getting the changing ratio
        var ratioH = div_h/this.height;
        
        paddingTop *= ratioH;
        outerHand *= ratioH;
        fullHandSize *= ratioH;
        
        // updating the size of the container
        var div = document.getElementById('divContainer');
        div.style.height = div_h+'px';
        div.style.width = div_w+'px';
        
        // updating the size of the image
        var imgBg = document.getElementById('myBkg');
        imgBg.style.height = div_h+'px';
        imgBg.style.width = div_w+'px';
        
        // updating the position of the hand
        var hand = document.getElementById('minuteHand');
        // centering the hand horizontally
        var left = div_w/2;
        hand.style.left = left+'px';
        
        // adjusting the distance from the top
        hand.style.top = Math.round(paddingTop - outerHand)+'px';
        
        // adjusting the height of the hand
        hand.style.height = Math.round(fullHandSize)+'px';
        hand.style.WebkitTransformOrigin = "center bottom";
        hand.style.MozTransformOrigin = "center bottom";
        hand.style.transformOrigin = "center bottom";
        
        // after the fakeImg is loaded, then we update the real one
        imgBg.src = this.src;
    };
    
    // we need to create a fake image to get its size and adjust everything
    fakeImg.src = 'http://npr.today/img/'+img;
    
    // we'll check again every 5 seconds
    clearTimeout(waitForIt);
    waitForIt = setTimeout(setbkg,1000*5);
    
    // updating the minute hand
    updateMinuteHand();
}

delayMinuteHand = null;

function updateMinuteHand() {
    var h = moment().tz('America/New_York').get('hour');
    var m = moment().tz('America/New_York').get('minute');
    var s = moment().tz('America/New_York').get('second');
    
    var radMinute = 360/60;
    var radSecond = (radMinute-5)/60; // -5 to account for small lag behind real time in mp3 stream
    
    // if you do NOT want the hand to move as the seconds go, just set 'radSecond' to zero
    
    var radius = radMinute*m + radSecond*s;
    
    var hand = document.getElementById('minuteHand');
    hand.style.WebkitTransform = "rotate("+radius+"deg)";
    hand.style.MozTransform = "rotate("+radius+"deg)";
    hand.style.transformOrigin = "rotate("+radius+"deg)";
    
    clearTimeout(delayMinuteHand);
    delayMinuteHand = setTimeout(updateMinuteHand,1000);
}
