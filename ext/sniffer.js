// sniffer.js - captures client-side events and dom interaction

var Sniffer = (function () {
   var last_event;
   document.addEventListener('click', mouseHandler, false);
   document.addEventListener('dblclick', mouseHandler, false);
   document.addEventListener('input', logInteraction, false);
   /*document.addEventListener('scroll', logInteraction, false);*/
   /*document.addEventListener('wheel', logInteraction, false);*/
   /*document.addEventListener('change', logInteraction, false);*/
    var snifferCaptureEvent = {
        callbacks: [],
        dispatch: function (e) {
            this.callbacks.forEach(function (c) {
                c(e);
            });
        },
        addListener: function (callback) {
            this.callbacks.push(callback);   
        }
    }

   function mouseHandler (e) {
       var e = window.e || e;
       var elem = findAnchor(e.target);
       // Anchor tag
       if (elem) {
           logLinkClicked(elem); 
       } else {  
           logInteraction(e);
       }
   }

   function findAnchor (e) {
        if (e == null || e.tagName == 'A') 
            return e;
        else
            return findAnchor(e.parentNode);
   }
   
   function logLinkClicked (tgt) {
       var from = normalizeUrl(document.URL);
       var to = normalizeUrl(tgt.href, document.URL);
       var time = Date.now();
       var msg = {
           'type': "capture-links", 
           'event': {
               'from': from, 
               'to': to, 
               'time': time
           }
       };
       // fixing relative paths    
       chrome.runtime.sendMessage(msg);
       snifferCaptureEvent.dispatch(msg.event);
       last_event = "capture-links";
   }
   
   function logInteraction (e) {
       var url = document.URL;
       var type = e.type;
       if (type == 'input' && last_event == type) return;
       var target =  e.target;
       if (!target || target == document || 
           (Object.keys(target).length === 0 && target.constructor === Object)) {
           return;
       }
       var time = Date.now();
       snifferCaptureEvent.dispatch({'event': type, 'target': target});
       var msg = {
           'type': "capture-interactions", 
           'event': {
                'event': type, 
                'url': url, 
                'target':  target.cloneNode().outerHTML,
                'time' : time
           }
       };
       chrome.runtime.sendMessage(msg);
       last_event = type;
   }

    return {
        onSnifferCapture: snifferCaptureEvent
    };
}());
