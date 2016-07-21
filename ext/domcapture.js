// domcapture.js - Captures dom mutations as diff tree
var UNDOREDO = (function () {
    function processMutations(ms) {
        var pms = [];
        ms.forEach(function (mut) {
            var parents = new Map();
            // Copy reference to parent
            mut.added.forEach(function (n) {
                parents.set(n, n.parentNode);
            });
            mut.removed.forEach(function (n) {
                parents.set(n, mut.getOldParentNode(n));
            });

            var attributeChanged = [];
            // Copy old and new attribute values
            Object.keys(mut.attributeChanged).forEach(function(attr) {
                attributeChanged[attr] = [];
                mut.attributeChanged[attr].forEach(function (elem) {
                    attributeChanged[attr].push({
                        elem: elem,
                        newVal: elem.getAttribute(attr),
                        oldVal: mut.getOldAttribute(elem, attr)
                    });
                });
            });
            pms.push({
                added: mut.added,
                removed: mut.removed,
                attributeChanged: attributeChanged,
                parents: parents
            });
        });
        return pms;
    }
    var BLOCKED_STATE = false;
    var observer = new MutationSummary({
        callback: function(ms) {
            if (BLOCKED_STATE) {
                BLOCKED_STATE = false;
                return;
            }
            console.log("CAPTURED", ms);
            history.add(processMutations(ms));
        },
        oldPreviousSibling: true,
        queries: [{all: true}]
    });


    var history = {
        stack: [],
        cur: 0,
        add: function (elem) {
            this.cur++;
            this.stack.push(elem);
        },
        next: function () {
            if (this.cur < this.stack.length) {
                return this.stack[this.cur++];
            } else {
                return undefined;
            }
        },
        prev: function () {
            if (this.cur >= 0) {
                return this.stack[--this.cur];
            } else {
                return undefined;
            }
        },
        goto: function (index) {
            if (index < this.stack.length && index >= 0) {
                this.cur = index;
                return this.stack[this.cur];
            } else {
                return undefined;
            }
        }
    };
    
    var UNDOREDO = {
        addNodes: function (nodes, parents) {
            nodes.forEach(function (n) {
                BLOCKED_STATE = true;
                var parent = parents.get(n);
                parent.insertBefore(n, parent.firstChild);
            });
        }, 

        removeNodes: function (nodes, parents) {
            nodes.forEach(function (n) {
                BLOCKED_STATE = true;
                var parent = parents.get(n);
                parent.removeChild(n);
            });
        }, 
        
        applyAttributes: function (attributes) {
            Object.keys(attributes).forEach(function (attr) {
                attributes[attr].forEach(function (pair) {
                    BLOCKED_STATE = true;
                    pair.elem.setAttribute(attr, pair.newVal);
                });
            });
        },

        reverseAttributes: function (attributes) {
            Object.keys(attributes).forEach(function (attr) {
                attributes[attr].forEach(function (pair) {
                    BLOCKED_STATE = true;
                    pair.elem.setAttribute(attr, pair.oldVal);
                });
            });
        },

        applyMutation: function (mut) {
            if (mut.added) {
                this.addNodes(mut.added, mut.parents);
            } 
            if (mut.removed) {
                this.removeNodes(mut.removed, mut.parents);
            }
            if (mut.attributeChanged) {
                this.applyAttributes(mut.attributeChanged);
            }
        },
        reverseMutation: function (mut) {
            if (mut.added) {
                this.removeNodes(mut.added, mut.parents);
            }
            if (mut.removed) {
                this.addNodes(mut.removed, mut.parents);
            }
            if (mut.attributeChanged) {
                this.reverseAttributes(mut.attributeChanged);
            }
        },

        forward: function () {
            var ms = history.next();
            if (ms == undefined) return;
            ms.forEach(function (m) {this.applyMutation(m);}, this);
        },
        back: function () {
            var ms = history.prev();
            if (ms == undefined) return;
            ms.forEach(function (m) {this.reverseMutation(m);}, this);
        }
    };
    var next_button = $('<input type="button" value="next" />');
    next_button
        .on('click', function () {UNDOREDO.forward();})
    var back_button = $('<input type="button" value="back" />');
    back_button
        .on('click', function () {UNDOREDO.back();})
    var box = $('<div id="undoredo"></div>')
        .css('position', 'fixed')
        .css('right', '50px')
        .css('top', '0px');
    back_button.appendTo(box);
    next_button.appendTo(box);
    BLOCKED_STATE = true;
    box.appendTo($('body'))
    BLOCKED_STATE = true;
    

    return UNDOREDO;
})();
