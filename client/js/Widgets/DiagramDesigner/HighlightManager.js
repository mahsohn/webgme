/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * 
 * Author: Robert Kereskenyi
 */

"use strict";

define(['logManager',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants'], function (logManager,
                                                                             DiagramDesignerWidgetConstants) {

    var HighlightManager;

    HighlightManager = function (options) {
        this.logger = logManager.create(((options && options.loggerName) || "HighlightManager"));

        this._diagramDesigner = options ? options.diagramDesigner : null;

        if (this._diagramDesigner === undefined || this._diagramDesigner === null) {
            this.logger.error("Trying to initialize a HighlightManager without a diagramDesigner...");
            throw ("HighlightManager can not be created");
        }

        this._highlightedElements = [];

        this.logger.debug("HighlightManager ctor finished");
    };

    HighlightManager.prototype.initialize = function (el) {
        var self = this;

        this.$el = el;

        this._diagramDesigner.addEventListener(this._diagramDesigner.events.ON_COMPONENT_DELETE, function (__diagramDesigner, componentId) {
            self._onComponentDelete(componentId);
        });
    };

    HighlightManager.prototype.activate = function () {
        this.$el.addClass(DiagramDesignerWidgetConstants.HIGHLIGHT_MODE_CLASS);
        this._activateMouseListeners();
    };

    HighlightManager.prototype.deactivate = function () {
        this._deactivateMouseListeners();
        this.$el.removeClass(DiagramDesignerWidgetConstants.HIGHLIGHT_MODE_CLASS);
        this._clear();
    };

    HighlightManager.prototype._activateMouseListeners = function () {
        var self = this;

        //handle click on designer-items
        this.$el.on('mousedown.HighlightManagerItem', 'div.' + DiagramDesignerWidgetConstants.DESIGNER_ITEM_CLASS,  function (event) {
            var itemId = $(this).attr("id"),
                rightClick = event.which === 3;
            if (self._diagramDesigner.mode === self._diagramDesigner.OPERATING_MODES.HIGHLIGHT) {
                self._highLight(itemId, rightClick);
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });

        //handle click on designer-connections
        this.$el.on('mousedown.HighlightManagerConnection', 'path[class~="' + DiagramDesignerWidgetConstants.DESIGNER_CONNECTION_CLASS +'"]',  function (event) {
            var connId = $(this).attr("id").replace(DiagramDesignerWidgetConstants.PATH_SHADOW_ARROW_END_ID_PREFIX, "").replace(DiagramDesignerWidgetConstants.PATH_SHADOW_ID_PREFIX, ""),
                rightClick = event.which === 3;
            if (self._diagramDesigner.mode === self._diagramDesigner.OPERATING_MODES.HIGHLIGHT) {
                self._highLight(connId, rightClick);
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });

        //disable context-menu on right-click
        this.$el.on('contextmenu.HighlightManager', function (event) {
            if (self._diagramDesigner.mode === self._diagramDesigner.OPERATING_MODES.HIGHLIGHT) {
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });

        //handle click on designer-items
        this.$el.on('dblclick.HighlightManagerItem', function (event) {
            if (self._diagramDesigner.mode === self._diagramDesigner.OPERATING_MODES.HIGHLIGHT) {
                self._clear();
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });
    };

    HighlightManager.prototype._deactivateMouseListeners = function () {
        //disable HighlightManager specific DOM event listeners
        this.$el.off('mousedown.HighlightManagerItem', 'div.' + DiagramDesignerWidgetConstants.DESIGNER_ITEM_CLASS);
        this.$el.off('mousedown.HighlightManagerConnection', 'path[class~="' + DiagramDesignerWidgetConstants.DESIGNER_CONNECTION_CLASS +'"]');
        this.$el.off('contextmenu.HighlightManager');
        this.$el.off('dblclick.HighlightManagerItem');
    };


    HighlightManager.prototype._highLight = function (id, highlightAssociated) {
        var idx = this._highlightedElements.indexOf(id),
            elementsToHighlight = [],
            associatedIDs,
            i;

        this.logger.debug('highlightAssociated, ID: "' + id + '", highlightAssociated: ' + highlightAssociated);

        if (idx === -1) {
            //highlight clicked and all associated
            elementsToHighlight.push(id);
            if (highlightAssociated) {
                //get all the connection that go in/out from this element and highlight them too
                if (this._diagramDesigner.itemIds.indexOf(id) !== -1) {
                    associatedIDs = this._diagramDesigner._getConnectionsForItem(id);
                    i = associatedIDs.length;
                    while (i--) {
                        if (this._highlightedElements.indexOf(associatedIDs[i]) === -1) {
                            elementsToHighlight.push(associatedIDs[i]);
                        }
                    }
                } else if (this._diagramDesigner.connectionIds.indexOf(id) !== -1) {
                    associatedIDs = this._diagramDesigner._getItemsForConnection(id);
                    i = associatedIDs.length;
                    while (i--) {
                        if (this._highlightedElements.indexOf(associatedIDs[i]) === -1) {
                            elementsToHighlight.push(associatedIDs[i]);
                        }
                    }
                }
            }

            i = elementsToHighlight.length;
            while (i--) {
                this._highlightedElements.push(elementsToHighlight[i]);
                this._diagramDesigner.items[elementsToHighlight[i]].highlight();
            }
            this.onHighlight(elementsToHighlight);
        } else {
            //unhighlight clicked and all associated
            elementsToHighlight.push(id);
            if (highlightAssociated) {
                //get all the connection that go in/out from this element and highlight them too
                if (this._diagramDesigner.itemIds.indexOf(id) !== -1) {
                    associatedIDs = this._diagramDesigner._getConnectionsForItem(id);
                    i = associatedIDs.length;
                    while (i--) {
                        if (this._highlightedElements.indexOf(associatedIDs[i]) !== -1) {
                            elementsToHighlight.push(associatedIDs[i]);
                        }
                    }
                } else if (this._diagramDesigner.connectionIds.indexOf(id) !== -1) {
                    associatedIDs = this._diagramDesigner._getItemsForConnection(id);
                    i = associatedIDs.length;
                    while (i--) {
                        if (this._highlightedElements.indexOf(associatedIDs[i]) !== -1) {
                            elementsToHighlight.push(associatedIDs[i]);
                        }
                    }
                }
            }

            i = elementsToHighlight.length;
            while (i--) {
                idx = this._highlightedElements.indexOf(elementsToHighlight[i]);
                this._highlightedElements.splice(idx, 1);
                this._diagramDesigner.items[elementsToHighlight[i]].unHighlight();
            }
            this.onUnhighlight(elementsToHighlight);
        }
    };


    HighlightManager.prototype._onComponentDelete = function (componentId) {
        var idx = this._highlightedElements.indexOf(componentId);

        if (idx !== -1) {
            this._highLight(componentId, false);
        }
    };

    HighlightManager.prototype._clear = function () {
        //unhighlight all the highlighted
        var i = this._highlightedElements.length,
            unhighlighted = this._highlightedElements.slice(0);

        while (i--) {
            this._diagramDesigner.items[this._highlightedElements[i]].unHighlight();
        }
        this._highlightedElements = [];
        this.onUnhighlight(unhighlighted);
    };

    HighlightManager.prototype.onHighlight = function (idList) {
        this.logger.debug('onHighlight idList: ' + idList);
    };

    HighlightManager.prototype.onUnhighlight = function (idList) {
        this.logger.debug('onUnhighlight idList: ' + idList);
    };


    return HighlightManager;
});
