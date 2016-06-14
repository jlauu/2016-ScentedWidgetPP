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
       if (e.target.tagName == 'A') {
           logLinkClicked(e.target);
       } else if (e.currentTarget.tagName == 'A') {
           logLinkClicked(e);
       }
   
       logInteraction(e);
   }
   
   function logLinkClicked (tgt) {
       var from = document.URL;
       var to = tgt.getAttribute("href")
       var time = Date.now();
       // fixing relative paths
       if (to.indexOf('http') != 0) {
           if (to[0] == '/' && from[from.length - 1] == '/') {
               to = from + to.slice(1,to.length);
           }
           to = from + to;
       }
       chrome.runtime.sendMessage({type: "capture-links", 
                                   event: {'from':from, 'to':to, 'time':time}});
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
       var msg = {'type': "capture-interactions", 
                  'event': {
                     'event': type, 
                     'url': url, 
                     'target': target.outerHTML,
                     'time' : time
                   }
       };
       chrome.runtime.sendMessage(msg);
       last_event = type;
   }
}());
