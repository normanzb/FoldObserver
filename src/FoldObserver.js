define(['./Defer'], function(Defer){
    'use strict';
    function FoldObserver() {
        var me = this;
        me.onStarted = null;
        me.onFound = null;
        me.onRendered = null;
        me.mutationObserver = null;
    }
    FoldObserver.prototype.observe = function() {
        var me = this;
        var fold = {
            height: 0,
            width: 0
        };
        var mutation;
        var node;
        var started = false;

        function handleOnRendered(){
            if (typeof me.onRendered === 'function') {
                me.onRendered();
            }
        }

        if (!window.MutationObserver || !('scrollingElement'  in document)) {
            if (typeof me.onFailed === 'function') {
                me.onFailed();
            }
            return;
        }

        return new Defer.Promise(function(rs){
                if (document.body) {
                    rs();
                }
                else {
                    var bodyObserver = new MutationObserver(function(mutations){
                        for(var mutationLength = mutations.length; mutationLength--;) {
                            mutation = mutations[mutationLength];
                            for(var addedNodesLength = mutation.addedNodes.length; addedNodesLength--;) {
                                node = mutation.addedNodes[addedNodesLength];
                                if (node.nodeType !== 1) {
                                    continue;
                                }
                                if (node.tagName === 'body') {
                                    bodyObserver.takeRecords();
                                    bodyObserver.disconnect();
                                    rs();
                                }
                            }
                        }
                    });
                    bodyObserver.observe(document.documentElement, {childList: true});
                }
            })
            .then(function(){
                fold.height = document.scrollingElement.scrollTop + window.innerHeight;
                fold.width = document.scrollingElement.scrollLeft + window.innerWidth;

                var observer = new MutationObserver(function(mutations){
                    for(var mutationLength = mutations.length; mutationLength--;) {
                        mutation = mutations[mutationLength];
                        for(var addedNodesLength = mutation.addedNodes.length; addedNodesLength--;) {
                            node = mutation.addedNodes[addedNodesLength];
                            if (node.nodeType !== 1) {
                                continue;
                            }
                            if (!started) {
                                if (typeof me.onStarted === 'function') {
                                    me.onStarted();
                                }
                                started = true;
                            }
                            if (
                                node.offsetTop + node.clientHeight > fold.height || 
                                node.offsetLeft + node.clientWidth > fold.width
                            ) {
                                me.disconnect();
                                if (typeof me.onFound === 'function') {
                                    me.onFound();
                                    setTimeout(handleOnRendered, 0);
                                }
                                return;
                            }
                        }
                    }
                });
                me.mutationObserver = observer;
                observer.observe(document.body, {childList: true});
            });
    };
    FoldObserver.prototype.disconnect = function() {
        var me = this;
        if (me.mutationObserver) {
            me.mutationObserver.takeRecords();
            me.mutationObserver.disconnect();
            me.mutationObserver = null;
        }
    };

    return FoldObserver;
});