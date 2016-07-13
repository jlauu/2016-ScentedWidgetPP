// sniffer.js
// content script - adds callback functions from our background page to
// elements we are listening to.

(function () {
   var last_event;
   document.addEventListener('click', mouseHandler, false);
   document.addEventListener('dblclick', mouseHandler, false);
   document.addEventListener('input', logInteraction, false);
   /*document.addEventListener('scroll', logInteraction, false);*/
   /*document.addEventListener('wheel', logInteraction, false);*/
   /*document.addEventListener('change', logInteraction, false);*/

   function mouseHandler (e) {
       var e = window.e || e;
       var elem = e.target;
       // Anchor tag
       if (elem.tagName == 'A') {
           logLinkClicked(elem.target);
       // Image tage
       } else if (elem.tagName == 'IMG' && elem.parentNode.tagName == 'A') {
           logLinkClicked(elem.parentNode);
       }
   
       logInteraction(e);
   }
   
   function logLinkClicked (tgt) {
       var from = URL(document.URL);
       from = from.host() + from.path() + from.queryString();
       var to = URL(URL.resolve(document.URL, tgt.href));
       to = to.host() + to.path() + to.queryString();
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
       var msg = {
           'type': "capture-interactions", 
           'event': {
                'event': type, 
                'url': url, 
                'target':  target.cloneNode(),
                'time' : time
           }
       };
       chrome.runtime.sendMessage(msg);
       last_event = type;
   }
}());
