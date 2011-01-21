/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

function require(module, callback) {

    if (Array.isArray(module)) {
        var params = [];
        module.forEach(function(m) {
            params.push(require._lookup(m));
        }, this);

        if (callback) {
            callback.apply(null, params);
        }
    }

    if (typeof module === 'string') {
        payload = require._lookup(module);
        if (callback) {
            callback();
        }
        return payload;
    }
}
require.modules = {};

require._lookup = function(moduleName) {
    var payload = require.modules[moduleName];
    var module_name = moduleName;
    if (payload == null) {
        console.error('Missing module: ' + moduleName);
        console.trace();
    }

    if (typeof payload === 'function') {
        var exports = {};
        var module = {
             id: moduleName,
             uri: ''
        };
        payload(require, exports, module);
        payload = exports;
        // cache the resulting module object for next time
        require.modules[module_name] = payload;
    }

    return payload;
};

function define(module, payload) {
    if (typeof module !== 'string') {
        console.error('dropping module because define wasn\'t munged.');
        console.trace();
        return;
    }

    // console.log('defining module: ' + module + ' as a ' + typeof payload);
    require.modules[module] = payload;
}
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/event', function(require, exports, module) {

var keys = require("pilot/keys");
var useragent = require("pilot/useragent");

exports.addListener = function(elem, type, callback) {
    if (elem.addEventListener) {
        return elem.addEventListener(type, callback, false);
    }
    if (elem.attachEvent) {
        var wrapper = function() {
            callback(window.event);
        };
        callback._wrapper = wrapper;
        elem.attachEvent("on" + type, wrapper);
    }
};

exports.removeListener = function(elem, type, callback) {
    if (elem.removeEventListener) {
        return elem.removeEventListener(type, callback, false);
    }
    if (elem.detachEvent) {
        elem.detachEvent("on" + type, callback._wrapper || callback);
    }
};

/**
* Prevents propagation and clobbers the default action of the passed event
*/
exports.stopEvent = function(e) {
    exports.stopPropagation(e);
    exports.preventDefault(e);
    return false;
};

exports.stopPropagation = function(e) {
    if (e.stopPropagation)
        e.stopPropagation();
    else
        e.cancelBubble = true;
};

exports.preventDefault = function(e) {
    if (e.preventDefault)
        e.preventDefault();
    else
        e.returnValue = false;
};

exports.getDocumentX = function(e) {
    if (e.clientX) {
        var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
        return e.clientX + scrollLeft;
    } else {
        return e.pageX;
    }
};

exports.getDocumentY = function(e) {
    if (e.clientY) {
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        return e.clientY + scrollTop;
    } else {
        return e.pageX;
    }
};

/**
 * @return {Number} 0 for left button, 1 for middle button, 2 for right button
 */
exports.getButton = function(e) {
    if (e.type == "dblclick")
        return 0;
    else if (e.type == "contextmenu")
        return 2;
        
    // DOM Event
    if (e.preventDefault) {
        return e.button;
    }
    // old IE
    else {
        return {1:0, 2:2, 4:1}[e.button];
    }
};

if (document.documentElement.setCapture) {
    exports.capture = function(el, eventHandler, releaseCaptureHandler) {
        function onMouseMove(e) {
            eventHandler(e);
            return exports.stopPropagation(e);
        }

        function onReleaseCapture(e) {
            eventHandler && eventHandler(e);
            releaseCaptureHandler && releaseCaptureHandler();

            exports.removeListener(el, "mousemove", eventHandler);
            exports.removeListener(el, "mouseup", onReleaseCapture);
            exports.removeListener(el, "losecapture", onReleaseCapture);

            el.releaseCapture();
        }

        exports.addListener(el, "mousemove", eventHandler);
        exports.addListener(el, "mouseup", onReleaseCapture);
        exports.addListener(el, "losecapture", onReleaseCapture);
        el.setCapture();
    };
}
else {
    exports.capture = function(el, eventHandler, releaseCaptureHandler) {
        function onMouseMove(e) {
            eventHandler(e);
            e.stopPropagation();
        }

        function onMouseUp(e) {
            eventHandler && eventHandler(e);
            releaseCaptureHandler && releaseCaptureHandler();

            document.removeEventListener("mousemove", onMouseMove, true);
            document.removeEventListener("mouseup", onMouseUp, true);

            e.stopPropagation();
        }

        document.addEventListener("mousemove", onMouseMove, true);
        document.addEventListener("mouseup", onMouseUp, true);
    };
}

exports.addMouseWheelListener = function(el, callback) {
    var listener = function(e) {
        if (e.wheelDelta !== undefined) {
            if (e.wheelDeltaX !== undefined) {
                e.wheelX = -e.wheelDeltaX / 8;
                e.wheelY = -e.wheelDeltaY / 8;
            } else {
                e.wheelX = 0;
                e.wheelY = -e.wheelDelta / 8;
            }
        }
        else {
            if (e.axis && e.axis == e.HORIZONTAL_AXIS) {
                e.wheelX = (e.detail || 0) * 5;
                e.wheelY = 0;
            } else {
                e.wheelX = 0;
                e.wheelY = (e.detail || 0) * 5;
            }
        }
        callback(e);
    };
    exports.addListener(el, "DOMMouseScroll", listener);
    exports.addListener(el, "mousewheel", listener);
};

exports.addMultiMouseDownListener = function(el, button, count, timeout, callback) {
    var clicks = 0;
    var startX, startY;

    var listener = function(e) {
        clicks += 1;
        if (clicks == 1) {
            startX = e.clientX;
            startY = e.clientY;

            setTimeout(function() {
                clicks = 0;
            }, timeout || 600);
        }

        if (exports.getButton(e) != button
          || Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5)
            clicks = 0;

        if (clicks == count) {
            clicks = 0;
            callback(e);
        }
        return exports.preventDefault(e);
    };

    exports.addListener(el, "mousedown", listener);
    useragent.isIE && exports.addListener(el, "dblclick", listener);
};

function normalizeCommandKeys(callback, e, keyCode) {
    var hashId = 0;
    if (useragent.isOpera && useragent.isMac) {
        hashId = 0 | (e.metaKey ? 1 : 0) | (e.altKey ? 2 : 0)
            | (e.shiftKey ? 4 : 0) | (e.ctrlKey ? 8 : 0);
    } else {
        hashId = 0 | (e.ctrlKey ? 1 : 0) | (e.altKey ? 2 : 0)
            | (e.shiftKey ? 4 : 0) | (e.metaKey ? 8 : 0);
    }

    if (keyCode in keys.MODIFIER_KEYS) {
        switch (keys.MODIFIER_KEYS[keyCode]) {
            case "Alt":
                hashId = 2;
                break;
            case "Shift":
                hashId = 4;
                break
            case "Ctrl":
                hashId = 1;
                break;
            default:
                hashId = 8;
                break;
        }
        keyCode = 0;
    }

    if (hashId & 8 && (keyCode == 91 || keyCode == 93)) {
        keyCode = 0;
    }

    // If there is no hashID and the keyCode is not a function key, then
    // we don't call the callback as we don't handle a command key here
    // (it's a normal key/character input).
    if (hashId == 0 && !(keyCode in keys.FUNCTION_KEYS)) {
        return false;
    }

    return callback(e, hashId, keyCode);
}

exports.addCommandKeyListener = function(el, callback) {
    var addListener = exports.addListener;
    if (useragent.isOldGecko) {
        // Old versions of Gecko aka. Firefox < 4.0 didn't repeat the keydown
        // event if the user pressed the key for a longer time. Instead, the
        // keydown event was fired once and later on only the keypress event.
        // To emulate the 'right' keydown behavior, the keyCode of the initial
        // keyDown event is stored and in the following keypress events the
        // stores keyCode is used to emulate a keyDown event.
        var lastKeyDownKeyCode = null;
        addListener(el, "keydown", function(e) {
            lastKeyDownKeyCode = e.keyCode;
        });
        addListener(el, "keypress", function(e) {
            return normalizeCommandKeys(callback, e, lastKeyDownKeyCode);
        });
    } else {
        var lastDown = null;

        addListener(el, "keydown", function(e) {
            lastDown = e.keyIdentifier || e.keyCode;
            return normalizeCommandKeys(callback, e, e.keyCode);
        });

        // repeated keys are fired as keypress and not keydown events
        if (useragent.isMac && useragent.isOpera) {
            addListener(el, "keypress", function(e) {
                var keyId = e.keyIdentifier || e.keyCode;
                if (lastDown !== keyId) {
                    return normalizeCommandKeys(callback, e, e.keyCode);
                } else {
                    lastDown = null;
                }
            });
        }
    }
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/promise', function(require, exports, module) {

var console = require("pilot/console");
var Trace = require('pilot/stacktrace').Trace;

/**
 * A promise can be in one of 2 states.
 * The ERROR and SUCCESS states are terminal, the PENDING state is the only
 * start state.
 */
var ERROR = -1;
var PENDING = 0;
var SUCCESS = 1;

/**
 * We give promises and ID so we can track which are outstanding
 */
var _nextId = 0;

/**
 * Debugging help if 2 things try to complete the same promise.
 * This can be slow (especially on chrome due to the stack trace unwinding) so
 * we should leave this turned off in normal use.
 */
var _traceCompletion = false;

/**
 * Outstanding promises. Handy list for debugging only.
 */
var _outstanding = [];

/**
 * Recently resolved promises. Also for debugging only.
 */
var _recent = [];

/**
 * Create an unfulfilled promise
 */
Promise = function () {
    this._status = PENDING;
    this._value = undefined;
    this._onSuccessHandlers = [];
    this._onErrorHandlers = [];

    // Debugging help
    this._id = _nextId++;
    //this._createTrace = new Trace(new Error());
    _outstanding[this._id] = this;
};

/**
 * Yeay for RTTI.
 */
Promise.prototype.isPromise = true;

/**
 * Have we either been resolve()ed or reject()ed?
 */
Promise.prototype.isComplete = function() {
    return this._status != PENDING;
};

/**
 * Have we resolve()ed?
 */
Promise.prototype.isResolved = function() {
    return this._status == SUCCESS;
};

/**
 * Have we reject()ed?
 */
Promise.prototype.isRejected = function() {
    return this._status == ERROR;
};

/**
 * Take the specified action of fulfillment of a promise, and (optionally)
 * a different action on promise rejection.
 */
Promise.prototype.then = function(onSuccess, onError) {
    if (typeof onSuccess === 'function') {
        if (this._status === SUCCESS) {
            onSuccess.call(null, this._value);
        } else if (this._status === PENDING) {
            this._onSuccessHandlers.push(onSuccess);
        }
    }

    if (typeof onError === 'function') {
        if (this._status === ERROR) {
            onError.call(null, this._value);
        } else if (this._status === PENDING) {
            this._onErrorHandlers.push(onError);
        }
    }

    return this;
};

/**
 * Like then() except that rather than returning <tt>this</tt> we return
 * a promise which
 */
Promise.prototype.chainPromise = function(onSuccess) {
    var chain = new Promise();
    chain._chainedFrom = this;
    this.then(function(data) {
        try {
            chain.resolve(onSuccess(data));
        } catch (ex) {
            chain.reject(ex);
        }
    }, function(ex) {
        chain.reject(ex);
    });
    return chain;
};

/**
 * Supply the fulfillment of a promise
 */
Promise.prototype.resolve = function(data) {
    return this._complete(this._onSuccessHandlers, SUCCESS, data, 'resolve');
};

/**
 * Renege on a promise
 */
Promise.prototype.reject = function(data) {
    return this._complete(this._onErrorHandlers, ERROR, data, 'reject');
};

/**
 * Internal method to be called on resolve() or reject().
 * @private
 */
Promise.prototype._complete = function(list, status, data, name) {
    // Complain if we've already been completed
    if (this._status != PENDING) {
        console.group('Promise already closed');
        console.error('Attempted ' + name + '() with ', data);
        console.error('Previous status = ', this._status,
                ', previous value = ', this._value);
        console.trace();

        if (this._completeTrace) {
            console.error('Trace of previous completion:');
            this._completeTrace.log(5);
        }
        console.groupEnd();
        return this;
    }

    if (_traceCompletion) {
        this._completeTrace = new Trace(new Error());
    }

    this._status = status;
    this._value = data;

    // Call all the handlers, and then delete them
    list.forEach(function(handler) {
        handler.call(null, this._value);
    }, this);
    this._onSuccessHandlers.length = 0;
    this._onErrorHandlers.length = 0;

    // Remove the given {promise} from the _outstanding list, and add it to the
    // _recent list, pruning more than 20 recent promises from that list.
    delete _outstanding[this._id];
    _recent.push(this);
    while (_recent.length > 20) {
        _recent.shift();
    }

    return this;
};

/**
 * Takes an array of promises and returns a promise that that is fulfilled once
 * all the promises in the array are fulfilled
 * @param group The array of promises
 * @return the promise that is fulfilled when all the array is fulfilled
 */
Promise.group = function(promiseList) {
    if (!(promiseList instanceof Array)) {
        promiseList = Array.prototype.slice.call(arguments);
    }

    // If the original array has nothing in it, return now to avoid waiting
    if (promiseList.length === 0) {
        return new Promise().resolve([]);
    }

    var groupPromise = new Promise();
    var results = [];
    var fulfilled = 0;

    var onSuccessFactory = function(index) {
        return function(data) {
            results[index] = data;
            fulfilled++;
            // If the group has already failed, silently drop extra results
            if (groupPromise._status !== ERROR) {
                if (fulfilled === promiseList.length) {
                    groupPromise.resolve(results);
                }
            }
        };
    };

    promiseList.forEach(function(promise, index) {
        var onSuccess = onSuccessFactory(index);
        var onError = groupPromise.reject.bind(groupPromise);
        promise.then(onSuccess, onError);
    });

    return groupPromise;
};

exports.Promise = Promise;
exports._outstanding = _outstanding;
exports._recent = _recent;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/dom', function(require, exports, module) {

exports.setText = function(elem, text) {
    if (elem.innerText !== undefined) {
        elem.innerText = text;
    }
    if (elem.textContent !== undefined) {
        elem.textContent = text;
    }
};

exports.hasCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g);
    return classes.indexOf(name) !== -1;
};

/**
* Add a CSS class to the list of classes on the given node
*/
exports.addCssClass = function(el, name) {
    if (!exports.hasCssClass(el, name)) {
        el.className += " " + name;
    }
};

/**
 * Add or remove a CSS class from the list of classes on the given node
 * depending on the value of <tt>include</tt>
 */
exports.setCssClass = function(node, className, include) {
    if (include) {
        exports.addCssClass(node, className);
    } else {
        exports.removeCssClass(node, className);
    }
};

/**
* Remove a CSS class from the list of classes on the given node
*/
exports.removeCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g);
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        classes.splice(index, 1);
    }
    el.className = classes.join(" ");
};

exports.importCssString = function(cssText, doc){
    doc = doc || document;        

    if (doc.createStyleSheet) {
        var sheet = doc.createStyleSheet();
        sheet.cssText = cssText;
    }
    else {
        var style = doc.createElement("style");
        style.appendChild(doc.createTextNode(cssText));
        doc.getElementsByTagName("head")[0].appendChild(style);
    }            
};

exports.getInnerWidth = function(element) {
    return (parseInt(exports.computedStyle(element, "paddingLeft"))
            + parseInt(exports.computedStyle(element, "paddingRight")) + element.clientWidth);
};

exports.getInnerHeight = function(element) {
    return (parseInt(exports.computedStyle(element, "paddingTop"))
            + parseInt(exports.computedStyle(element, "paddingBottom")) + element.clientHeight);
};

exports.computedStyle = function(element, style) {
    if (window.getComputedStyle) {
        return (window.getComputedStyle(element, "") || {})[style] || "";
    }
    else {
        return element.currentStyle[style];
    }
};

exports.scrollbarWidth = function() {

    var inner = document.createElement('p');
    inner.style.width = "100%";
    inner.style.height = "200px";

    var outer = document.createElement("div");
    var style = outer.style;

    style.position = "absolute";
    style.left = "-10000px";
    style.overflow = "hidden";
    style.width = "200px";
    style.height = "150px";

    outer.appendChild(inner);
    document.body.appendChild(outer);
    var noScrollbar = inner.offsetWidth;

    style.overflow = "scroll";
    var withScrollbar = inner.offsetWidth;

    if (noScrollbar == withScrollbar) {
        withScrollbar = outer.clientWidth;
    }

    document.body.removeChild(outer);

    return noScrollbar-withScrollbar;
};

/**
 * Optimized set innerHTML. This is faster than plain innerHTML if the element
 * already contains a lot of child elements.
 * 
 * See http://blog.stevenlevithan.com/archives/faster-than-innerhtml for details
 */
exports.setInnerHtml = function(el, innerHtml) {
	var element = el.cloneNode(false);//document.createElement("div");
    element.innerHTML = innerHtml;
    el.parentNode.replaceChild(element, el);
    return element;
};

exports.getParentWindow = function(document) {
    return document.defaultView || document.parentWindow;
};

exports.getSelectionStart = function(textarea) {
    // TODO IE
    var start;
    try {
        start = textarea.selectionStart || 0;
    } catch (e) {
        start = 0;
    }
    return start;
};

exports.setSelectionStart = function(textarea, start) {
    // TODO IE
    return textarea.selectionStart = start;
};

exports.getSelectionEnd = function(textarea) {
    // TODO IE
    var end;
    try {
        end = textarea.selectionEnd || 0;
    } catch (e) {
        end = 0;
    }
    return end;
};

exports.setSelectionEnd = function(textarea, end) {
    // TODO IE
    return textarea.selectionEnd = end;
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/event_emitter', function(require, exports, module) {

var EventEmitter = {};

EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners || !listeners.length) return;

    var e = e || {};
    e.type = eventName;

    for (var i=0; i<listeners.length; i++) {
        listeners[i](e);
    }
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners) {
      var listeners = this._eventRegistry[eventName] = [];
    }
    if (listeners.indexOf(callback) == -1) {
        listeners.push(callback);
    }
};

EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners) {
      return;
    }
    var index = listeners.indexOf(callback);
    if (index !== -1) {
        listeners.splice(index, 1);
    }
};

exports.EventEmitter = EventEmitter;

});
define('pilot/stacktrace', function(require, exports, module) {
    
var ua = require("pilot/useragent");
var console = require('pilot/console');

// Changed to suit the specific needs of running within Skywriter

// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
//                  Luke Smith http://lucassmith.name/ (2008)
//                  Loic Dachary <loic@dachary.org> (2008)
//                  Johan Euphrosine <proppy@aminche.com> (2008)
//                  Øyvind Sean Kinsey http://kinsey.no/blog
//
// Information and discussions
// http://jspoker.pokersource.info/skin/test-printstacktrace.html
// http://eriwen.com/javascript/js-stack-trace/
// http://eriwen.com/javascript/stacktrace-update/
// http://pastie.org/253058
// http://browsershots.org/http://jspoker.pokersource.info/skin/test-printstacktrace.html
//

//
// guessFunctionNameFromLines comes from firebug
//
// Software License Agreement (BSD License)
//
// Copyright (c) 2007, Parakey Inc.
// All rights reserved.
//
// Redistribution and use of this software in source and binary forms, with or without modification,
// are permitted provided that the following conditions are met:
//
// * Redistributions of source code must retain the above
//   copyright notice, this list of conditions and the
//   following disclaimer.
//
// * Redistributions in binary form must reproduce the above
//   copyright notice, this list of conditions and the
//   following disclaimer in the documentation and/or other
//   materials provided with the distribution.
//
// * Neither the name of Parakey Inc. nor the names of its
//   contributors may be used to endorse or promote products
//   derived from this software without specific prior
//   written permission of Parakey Inc.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
// IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
// IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
// OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



/**
 * Different browsers create stack traces in different ways.
 * <strike>Feature</strike> Browser detection baby ;).
 */
var mode = (function() {

    // We use SC's browser detection here to avoid the "break on error"
    // functionality provided by Firebug. Firebug tries to do the right
    // thing here and break, but it happens every time you load the page.
    // bug 554105
    if (ua.isGecko) {
        return 'firefox';
    } else if (ua.isOpera) {
        return 'opera';
    } else {
        return 'other';
    }

    // SC doesn't do any detection of Chrome at this time.

    // this is the original feature detection code that is used as a
    // fallback.
    try {
        (0)();
    } catch (e) {
        if (e.arguments) {
            return 'chrome';
        }
        if (e.stack) {
            return 'firefox';
        }
        if (window.opera && !('stacktrace' in e)) { //Opera 9-
            return 'opera';
        }
    }
    return 'other';
})();

/**
 *
 */
function stringifyArguments(args) {
    for (var i = 0; i < args.length; ++i) {
        var argument = args[i];
        if (typeof argument == 'object') {
            args[i] = '#object';
        } else if (typeof argument == 'function') {
            args[i] = '#function';
        } else if (typeof argument == 'string') {
            args[i] = '"' + argument + '"';
        }
    }
    return args.join(',');
}

/**
 * Extract a stack trace from the format emitted by each browser.
 */
var decoders = {
    chrome: function(e) {
        var stack = e.stack;
        if (!stack) {
            console.log(e);
            return [];
        }
        return stack.replace(/^.*?\n/, '').
                replace(/^.*?\n/, '').
                replace(/^.*?\n/, '').
                replace(/^[^\(]+?[\n$]/gm, '').
                replace(/^\s+at\s+/gm, '').
                replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@').
                split('\n');
    },

    firefox: function(e) {
        var stack = e.stack;
        if (!stack) {
            console.log(e);
            return [];
        }
        // stack = stack.replace(/^.*?\n/, '');
        stack = stack.replace(/(?:\n@:0)?\s+$/m, '');
        stack = stack.replace(/^\(/gm, '{anonymous}(');
        return stack.split('\n');
    },

    // Opera 7.x and 8.x only!
    opera: function(e) {
        var lines = e.message.split('\n'), ANON = '{anonymous}',
            lineRE = /Line\s+(\d+).*?script\s+(http\S+)(?:.*?in\s+function\s+(\S+))?/i, i, j, len;

        for (i = 4, j = 0, len = lines.length; i < len; i += 2) {
            if (lineRE.test(lines[i])) {
                lines[j++] = (RegExp.$3 ? RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 : ANON + '()@' + RegExp.$2 + ':' + RegExp.$1) +
                ' -- ' +
                lines[i + 1].replace(/^\s+/, '');
            }
        }

        lines.splice(j, lines.length - j);
        return lines;
    },

    // Safari, Opera 9+, IE, and others
    other: function(curr) {
        var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], j = 0, fn, args;

        var maxStackSize = 10;
        while (curr && stack.length < maxStackSize) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            args = Array.prototype.slice.call(curr['arguments']);
            stack[j++] = fn + '(' + stringifyArguments(args) + ')';

            //Opera bug: if curr.caller does not exist, Opera returns curr (WTF)
            if (curr === curr.caller && window.opera) {
                //TODO: check for same arguments if possible
                break;
            }
            curr = curr.caller;
        }
        return stack;
    }
};

/**
 *
 */
function NameGuesser() {
}

NameGuesser.prototype = {

    sourceCache: {},

    ajax: function(url) {
        var req = this.createXMLHTTPObject();
        if (!req) {
            return;
        }
        req.open('GET', url, false);
        req.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
        req.send('');
        return req.responseText;
    },

    createXMLHTTPObject: function() {
	    // Try XHR methods in order and store XHR factory
        var xmlhttp, XMLHttpFactories = [
            function() {
                return new XMLHttpRequest();
            }, function() {
                return new ActiveXObject('Msxml2.XMLHTTP');
            }, function() {
                return new ActiveXObject('Msxml3.XMLHTTP');
            }, function() {
                return new ActiveXObject('Microsoft.XMLHTTP');
            }
        ];
        for (var i = 0; i < XMLHttpFactories.length; i++) {
            try {
                xmlhttp = XMLHttpFactories[i]();
                // Use memoization to cache the factory
                this.createXMLHTTPObject = XMLHttpFactories[i];
                return xmlhttp;
            } catch (e) {}
        }
    },

    getSource: function(url) {
        if (!(url in this.sourceCache)) {
            this.sourceCache[url] = this.ajax(url).split('\n');
        }
        return this.sourceCache[url];
    },

    guessFunctions: function(stack) {
        for (var i = 0; i < stack.length; ++i) {
            var reStack = /{anonymous}\(.*\)@(\w+:\/\/([-\w\.]+)+(:\d+)?[^:]+):(\d+):?(\d+)?/;
            var frame = stack[i], m = reStack.exec(frame);
            if (m) {
                var file = m[1], lineno = m[4]; //m[7] is character position in Chrome
                if (file && lineno) {
                    var functionName = this.guessFunctionName(file, lineno);
                    stack[i] = frame.replace('{anonymous}', functionName);
                }
            }
        }
        return stack;
    },

    guessFunctionName: function(url, lineNo) {
        try {
            return this.guessFunctionNameFromLines(lineNo, this.getSource(url));
        } catch (e) {
            return 'getSource failed with url: ' + url + ', exception: ' + e.toString();
        }
    },

    guessFunctionNameFromLines: function(lineNo, source) {
        var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/;
        var reGuessFunction = /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*(function|eval|new Function)/;
        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        var line = '', maxLines = 10;
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;
            if (line !== undefined) {
                var m = reGuessFunction.exec(line);
                if (m) {
                    return m[1];
                }
                else {
                    m = reFunctionArgNames.exec(line);
                }
                if (m && m[1]) {
                    return m[1];
                }
            }
        }
        return '(?)';
    }
};

var guesser = new NameGuesser();

var frameIgnorePatterns = [
    /http:\/\/localhost:4020\/sproutcore.js:/
];

exports.ignoreFramesMatching = function(regex) {
    frameIgnorePatterns.push(regex);
};

/**
 * Create a stack trace from an exception
 * @param ex {Error} The error to create a stacktrace from (optional)
 * @param guess {Boolean} If we should try to resolve the names of anonymous functions
 */
exports.Trace = function Trace(ex, guess) {
    this._ex = ex;
    this._stack = decoders[mode](ex);

    if (guess) {
        this._stack = guesser.guessFunctions(this._stack);
    }
};

/**
 * Log to the console a number of lines (default all of them)
 * @param lines {number} Maximum number of lines to wrote to console
 */
exports.Trace.prototype.log = function(lines) {
    if (lines <= 0) {
        // You aren't going to have more lines in your stack trace than this
        // and it still fits in a 32bit integer
        lines = 999999999;
    }

    var printed = 0;
    for (var i = 0; i < this._stack.length && printed < lines; i++) {
        var frame = this._stack[i];
        var display = true;
        frameIgnorePatterns.forEach(function(regex) {
            if (regex.test(frame)) {
                display = false;
            }
        });
        if (display) {
            console.debug(frame);
            printed++;
        }
    }
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/types', function(require, exports, module) {

/**
 * Some types can detect validity, that is to say they can distinguish between
 * valid and invalid values.
 * TODO: Change these constants to be numbers for more performance?
 */
var Status = {
    /**
     * The conversion process worked without any problem, and the value is
     * valid. There are a number of failure states, so the best way to check
     * for failure is (x !== Status.VALID)
     */
    VALID: {
        toString: function() { return 'VALID'; },
        valueOf: function() { return 0; }
    },

    /**
     * A conversion process failed, however it was noted that the string
     * provided to 'parse()' could be VALID by the addition of more characters,
     * so the typing may not be actually incorrect yet, just unfinished.
     * @see Status.INVALID
     */
    INCOMPLETE: {
        toString: function() { return 'INCOMPLETE'; },
        valueOf: function() { return 1; }
    },

    /**
     * The conversion process did not work, the value should be null and a
     * reason for failure should have been provided. In addition some completion
     * values may be available.
     * @see Status.INCOMPLETE
     */
    INVALID: {
        toString: function() { return 'INVALID'; },
        valueOf: function() { return 2; }
    },

    /**
     * A combined status is the worser of the provided statuses
     */
    combine: function(statuses) {
        var combined = Status.VALID;
        for (var i = 0; i < arguments; i++) {
            if (arguments[i] > combined) {
                combined = arguments[i];
            }
        }
        return combined;
    }
};
exports.Status = Status;

/**
 * The type.parse() method returns a Conversion to inform the user about not
 * only the result of a Conversion but also about what went wrong.
 * We could use an exception, and throw if the conversion failed, but that
 * seems to violate the idea that exceptions should be exceptional. Typos are
 * not. Also in order to store both a status and a message we'd still need
 * some sort of exception type...
 */
function Conversion(value, status, message, predictions) {
    /**
     * The result of the conversion process. Will be null if status != VALID
     */
    this.value = value;

    /**
     * The status of the conversion.
     * @see Status
     */
    this.status = status || Status.VALID;

    /**
     * A message to go with the conversion. This could be present for any status
     * including VALID in the case where we want to note a warning for example.
     * I18N: On the one hand this nasty and un-internationalized, however with
     * a command line it is hard to know where to start.
     */
    this.message = message;

    /**
     * A array of strings which are the systems best guess at better inputs than
     * the one presented.
     * We generally expect there to be about 7 predictions (to match human list
     * comprehension ability) however it is valid to provide up to about 20,
     * or less. It is the job of the predictor to decide a smart cut-off.
     * For example if there are 4 very good matches and 4 very poor ones,
     * probably only the 4 very good matches should be presented.
     */
    this.predictions = predictions || [];
}
exports.Conversion = Conversion;

/**
 * Most of our types are 'static' e.g. there is only one type of 'text', however
 * some types like 'selection' and 'deferred' are customizable. The basic
 * Type type isn't useful, but does provide documentation about what types do.
 */
function Type() {
};
Type.prototype = {
    /**
     * Convert the given <tt>value</tt> to a string representation.
     * Where possible, there should be round-tripping between values and their
     * string representations.
     */
    stringify: function(value) { throw new Error("not implemented"); },

    /**
     * Convert the given <tt>str</tt> to an instance of this type.
     * Where possible, there should be round-tripping between values and their
     * string representations.
     * @return Conversion
     */
    parse: function(str) { throw new Error("not implemented"); },

    /**
     * The plug-in system, and other things need to know what this type is
     * called. The name alone is not enough to fully specify a type. Types like
     * 'selection' and 'deferred' need extra data, however this function returns
     * only the name, not the extra data.
     * <p>In old bespin, equality was based on the name. This may turn out to be
     * important in Ace too.
     */
    name: undefined,

    /**
     * If there is some concept of a higher value, return it,
     * otherwise return undefined.
     */
    increment: function(value) {
        return undefined;
    },

    /**
     * If there is some concept of a lower value, return it,
     * otherwise return undefined.
     */
    decrement: function(value) {
        return undefined;
    },

    /**
     * There is interesting information (like predictions) in a conversion of
     * nothing, the output of this can sometimes be customized.
     * @return Conversion
     */
    getDefault: function() {
        return this.parse('');
    }
};
exports.Type = Type;

/**
 * Private registry of types
 * Invariant: types[name] = type.name
 */
var types = {};

/**
 * Add a new type to the list available to the system.
 * You can pass 2 things to this function - either an instance of Type, in
 * which case we return this instance when #getType() is called with a 'name'
 * that matches type.name.
 * Also you can pass in a constructor (i.e. function) in which case when
 * #getType() is called with a 'name' that matches Type.prototype.name we will
 * pass the typeSpec into this constructor. See #reconstituteType().
 */
exports.registerType = function(type) {
    if (typeof type === 'object') {
        if (type instanceof Type) {
            if (!type.name) {
                throw new Error('All registered types must have a name');
            }
            types[type.name] = type;
        }
        else {
            throw new Error('Can\'t registerType using: ' + type);
        }
    }
    else if (typeof type === 'function') {
        if (!type.prototype.name) {
            throw new Error('All registered types must have a name');
        }
        types[type.prototype.name] = type;
    }
    else {
        throw new Error('Unknown type: ' + type);
    }
};

/**
 * Remove a type from the list available to the system
 */
exports.deregisterType = function(type) {
    delete types[type.name];
};

/**
 * See description of #exports.registerType()
 */
function reconstituteType(name, typeSpec) {
    if (name.substr(-2) === '[]') { // i.e. endsWith('[]')
        var subtypeName = name.slice(0, -2);
        return new types['array'](subtypeName);
    }

    var type = types[name];
    if (typeof type === 'function') {
        type = new type(typeSpec);
    }
    return type;
}

/**
 * Find a type, previously registered using #registerType()
 */
exports.getType = function(typeSpec) {
    if (typeof typeSpec === 'string') {
        return reconstituteType(typeSpec);
    }

    if (typeof typeSpec === 'object') {
        if (!typeSpec.name) {
            throw new Error('Missing \'name\' member to typeSpec');
        }
        return reconstituteType(typeSpec.name, typeSpec);
    }

    throw new Error('Can\'t extract type from ' + typeSpec);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Julian Viereck (jviereck@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/catalog', function(require, exports, module) {


var extensionSpecs = {};

exports.addExtensionSpec = function(extensionSpec) {
    extensionSpecs[extensionSpec.name] = extensionSpec;
};

exports.removeExtensionSpec = function(extensionSpec) {
    if (typeof extensionSpec === "string") {
        delete extensionSpecs[extensionSpec];
    }
    else {
        delete extensionSpecs[extensionSpec.name];
    }
};

exports.getExtensionSpec = function(name) {
    return extensionSpecs[name];
};

exports.getExtensionSpecs = function() {
    return Object.keys(extensionSpecs);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/oop', function(require, exports, module) {

exports.inherits = (function() {
    var tempCtor = function() {};
    return function(ctor, superCtor) {
        tempCtor.prototype = superCtor.prototype;
        ctor.super_ = superCtor.prototype;
        ctor.prototype = new tempCtor();
        ctor.prototype.constructor = ctor;
    }
}());

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/lang', function(require, exports, module) {

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
     return new Array(count + 1).join(string);
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

/**
 * splice out of 'array' anything that === 'value'
 */
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.deferredCall = function(fcn) {

    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    return {
        schedule: function(timeout) {
            if (!timer) {
                timer = setTimeout(callback, timeout || 0);
            }
            return this;
        },

        call: function() {
            this.cancel();
            fcn();
            return this;
        },

        cancel: function() {
            clearTimeout(timer);
            timer = null;
            return this;
        }
    };
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is DomTemplate.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com) (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/domtemplate', function(require, exports, module) {


// WARNING: do not 'use_strict' without reading the notes in envEval;

/**
 * A templater that allows one to quickly template DOM nodes.
 */
function Templater() {
  this.scope = [];
};

/**
 * Recursive function to walk the tree processing the attributes as it goes.
 * @param node the node to process. If you pass a string in instead of a DOM
 * element, it is assumed to be an id for use with document.getElementById()
 * @param data the data to use for node processing.
 */
Templater.prototype.processNode = function(node, data) {
  if (typeof node === 'string') {
    node = document.getElementById(node);
  }
  if (data === null || data === undefined) {
    data = {};
  }
  this.scope.push(node.nodeName + (node.id ? '#' + node.id : ''));
  try {
    // Process attributes
    if (node.attributes && node.attributes.length) {
      // We need to handle 'foreach' and 'if' first because they might stop
      // some types of processing from happening, and foreach must come first
      // because it defines new data on which 'if' might depend.
      if (node.hasAttribute('foreach')) {
        this.processForEach(node, data);
        return;
      }
      if (node.hasAttribute('if')) {
        if (!this.processIf(node, data)) {
          return;
        }
      }
      // Only make the node available once we know it's not going away
      data.__element = node;
      // It's good to clean up the attributes when we've processed them,
      // but if we do it straight away, we mess up the array index
      var attrs = Array.prototype.slice.call(node.attributes);
      for (var i = 0; i < attrs.length; i++) {
        var value = attrs[i].value;
        var name = attrs[i].name;
        this.scope.push(name);
        try {
          if (name === 'save') {
            // Save attributes are a setter using the node
            value = this.stripBraces(value);
            this.property(value, data, node);
            node.removeAttribute('save');
          } else if (name.substring(0, 2) === 'on') {
            // Event registration relies on property doing a bind
            value = this.stripBraces(value);
            var func = this.property(value, data);
            if (typeof func !== 'function') {
              this.handleError('Expected ' + value +
                ' to resolve to a function, but got ' + typeof func);
            }
            node.removeAttribute(name);
            var capture = node.hasAttribute('capture' + name.substring(2));
            node.addEventListener(name.substring(2), func, capture);
            if (capture) {
              node.removeAttribute('capture' + name.substring(2));
            }
          } else {
            // Replace references in all other attributes
            var self = this;
            var newValue = value.replace(/\$\{[^}]*\}/g, function(path) {
              return self.envEval(path.slice(2, -1), data, value);
            });
            // Remove '_' prefix of attribute names so the DOM won't try
            // to use them before we've processed the template
            if (name.charAt(0) === '_') {
              node.removeAttribute(name);
              node.setAttribute(name.substring(1), newValue);
            } else if (value !== newValue) {
              attrs[i].value = newValue;
            }
          }
        } finally {
          this.scope.pop();
        }
      }
    }

    // Loop through our children calling processNode. First clone them, so the
    // set of nodes that we visit will be unaffected by additions or removals.
    var childNodes = Array.prototype.slice.call(node.childNodes);
    for (var j = 0; j < childNodes.length; j++) {
      this.processNode(childNodes[j], data);
    }

    if (node.nodeType === Node.TEXT_NODE) {
      this.processTextNode(node, data);
    }
  } finally {
    this.scope.pop();
  }
};

/**
 * Handle <x if="${...}">
 * @param node An element with an 'if' attribute
 * @param data The data to use with envEval
 * @returns true if processing should continue, false otherwise
 */
Templater.prototype.processIf = function(node, data) {
  this.scope.push('if');
  try {
    var originalValue = node.getAttribute('if');
    var value = this.stripBraces(originalValue);
    var recurse = true;
    try {
      var reply = this.envEval(value, data, originalValue);
      recurse = !!reply;
    } catch (ex) {
      this.handleError('Error with \'' + value + '\'', ex);
      recurse = false;
    }
    if (!recurse) {
      node.parentNode.removeChild(node);
    }
    node.removeAttribute('if');
    return recurse;
  } finally {
    this.scope.pop();
  }
};

/**
 * Handle <x foreach="param in ${array}"> and the special case of
 * <loop foreach="param in ${array}">
 * @param node An element with a 'foreach' attribute
 * @param data The data to use with envEval
 */
Templater.prototype.processForEach = function(node, data) {
  this.scope.push('foreach');
  try {
    var originalValue = node.getAttribute('foreach');
    var value = originalValue;

    var paramName = 'param';
    if (value.charAt(0) === '$') {
      // No custom loop variable name. Use the default: 'param'
      value = this.stripBraces(value);
    } else {
      // Extract the loop variable name from 'NAME in ${ARRAY}'
      var nameArr = value.split(' in ');
      paramName = nameArr[0].trim();
      value = this.stripBraces(nameArr[1].trim());
    }
    node.removeAttribute('foreach');
    try {
      var self = this;
      // Process a single iteration of a loop
      var processSingle = function(member, clone, ref) {
        ref.parentNode.insertBefore(clone, ref);
        data[paramName] = member;
        self.processNode(clone, data);
        delete data[paramName];
      };

      // processSingle is no good for <loop> nodes where we want to work on
      // the childNodes rather than the node itself
      var processAll = function(scope, member) {
        self.scope.push(scope);
        try {
          if (node.nodeName === 'LOOP') {
            for (var i = 0; i < node.childNodes.length; i++) {
              var clone = node.childNodes[i].cloneNode(true);
              processSingle(member, clone, node);
            }
          } else {
            var clone = node.cloneNode(true);
            clone.removeAttribute('foreach');
            processSingle(member, clone, node);
          }
        } finally {
          self.scope.pop();
        }
      };

      var reply = this.envEval(value, data, originalValue);
      if (Array.isArray(reply)) {
        reply.forEach(function(data, i) {
          processAll('' + i, data);
        }, this);
      } else {
        for (var param in reply) {
          if (reply.hasOwnProperty(param)) {
            processAll(param, param);
          }
        }
      }
      node.parentNode.removeChild(node);
    } catch (ex) {
      this.handleError('Error with \'' + value + '\'', ex);
    }
  } finally {
    this.scope.pop();
  }
};

/**
 * Take a text node and replace it with another text node with the ${...}
 * sections parsed out. We replace the node by altering node.parentNode but
 * we could probably use a DOM Text API to achieve the same thing.
 * @param node The Text node to work on
 * @param data The data to use in calls to envEval
 */
Templater.prototype.processTextNode = function(node, data) {
  // Replace references in other attributes
  var value = node.data;
  // We can't use the string.replace() with function trick (see generic
  // attribute processing in processNode()) because we need to support
  // functions that return DOM nodes, so we can't have the conversion to a
  // string.
  // Instead we process the string as an array of parts. In order to split
  // the string up, we first replace '${' with '\uF001$' and '}' with '\uF002'
  // We can then split using \uF001 or \uF002 to get an array of strings
  // where scripts are prefixed with $.
  // \uF001 and \uF002 are just unicode chars reserved for private use.
  value = value.replace(/\$\{([^}]*)\}/g, '\uF001$$$1\uF002');
  var parts = value.split(/\uF001|\uF002/);
  if (parts.length > 1) {
    parts.forEach(function(part) {
      if (part === null || part === undefined || part === '') {
        return;
      }
      if (part.charAt(0) === '$') {
        part = this.envEval(part.slice(1), data, node.data);
      }
      // It looks like this was done a few lines above but see envEval
      if (part === null) {
        part = "null";
      }
      if (part === undefined) {
        part = "undefined";
      }
      // if (isDOMElement(part)) { ... }
      if (typeof part.cloneNode !== 'function') {
        part = node.ownerDocument.createTextNode(part.toString());
      }
      node.parentNode.insertBefore(part, node);
    }, this);
    node.parentNode.removeChild(node);
  }
};

/**
 * Warn of string does not begin '${' and end '}'
 * @param str the string to check.
 * @return The string stripped of ${ and }, or untouched if it does not match
 */
Templater.prototype.stripBraces = function(str) {
  if (!str.match(/\$\{.*\}/g)) {
    this.handleError('Expected ' + str + ' to match ${...}');
    return str;
  }
  return str.slice(2, -1);
};

/**
 * Combined getter and setter that works with a path through some data set.
 * For example:
 * <ul>
 * <li>property('a.b', { a: { b: 99 }}); // returns 99
 * <li>property('a', { a: { b: 99 }}); // returns { b: 99 }
 * <li>property('a', { a: { b: 99 }}, 42); // returns 99 and alters the
 * input data to be { a: { b: 42 }}
 * </ul>
 * @param path An array of strings indicating the path through the data, or
 * a string to be cut into an array using <tt>split('.')</tt>
 * @param data An object to look in for the <tt>path</tt> argument
 * @param newValue (optional) If defined, this value will replace the
 * original value for the data at the path specified.
 * @return The value pointed to by <tt>path</tt> before any
 * <tt>newValue</tt> is applied.
 */
Templater.prototype.property = function(path, data, newValue) {
  this.scope.push(path);
  try {
    if (typeof path === 'string') {
      path = path.split('.');
    }
    var value = data[path[0]];
    if (path.length === 1) {
      if (newValue !== undefined) {
        data[path[0]] = newValue;
      }
      if (typeof value === 'function') {
        return function() {
          return value.apply(data, arguments);
        };
      }
      return value;
    }
    if (!value) {
      this.handleError('Can\'t find path=' + path);
      return null;
    }
    return this.property(path.slice(1), value, newValue);
  } finally {
    this.scope.pop();
  }
};

/**
 * Like eval, but that creates a context of the variables in <tt>env</tt> in
 * which the script is evaluated.
 * WARNING: This script uses 'with' which is generally regarded to be evil.
 * The alternative is to create a Function at runtime that takes X parameters
 * according to the X keys in the env object, and then call that function using
 * the values in the env object. This is likely to be slow, but workable.
 * @param script The string to be evaluated.
 * @param env The environment in which to eval the script.
 * @param context Optional debugging string in case of failure
 * @return The return value of the script, or the error message if the script
 * execution failed.
 */
Templater.prototype.envEval = function(script, env, context) {
  with (env) {
    try {
      this.scope.push(context);
      return eval(script);
    } catch (ex) {
      this.handleError('Template error evaluating \'' + script + '\'', ex);
      return script;
    } finally {
      this.scope.pop();
    }
  }
};

/**
 * A generic way of reporting errors, for easy overloading in different
 * environments.
 * @param message the error message to report.
 * @param ex optional associated exception.
 */
Templater.prototype.handleError = function(message, ex) {
  this.logError(message);
  this.logError('In: ' + this.scope.join(' > '));
  if (ex) {
    this.logError(ex);
  }
};


/**
 * A generic way of reporting errors, for easy overloading in different
 * environments.
 * @param message the error message to report.
 */
Templater.prototype.logError = function(message) {
  window.console && window.console.log && console.log(message);
};

exports.Templater = Templater;


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *   Patrick Walton (pwalton@mozilla.com)
 *   Julian Viereck (jviereck@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
define('pilot/console', function(require, exports, module) {
    
/**
 * This object represents a "safe console" object that forwards debugging
 * messages appropriately without creating a dependency on Firebug in Firefox.
 */

var noop = function() {};

// These are the functions that are available in Chrome 4/5, Safari 4
// and Firefox 3.6. Don't add to this list without checking browser support
var NAMES = [
    "assert", "count", "debug", "dir", "dirxml", "error", "group", "groupEnd",
    "info", "log", "profile", "profileEnd", "time", "timeEnd", "trace", "warn"
];

if (typeof(window) === 'undefined') {
    // We're in a web worker. Forward to the main thread so the messages
    // will show up.
    NAMES.forEach(function(name) {
        exports[name] = function() {
            var args = Array.prototype.slice.call(arguments);
            var msg = { op: 'log', method: name, args: args };
            postMessage(JSON.stringify(msg));
        };
    });
} else {
    // For each of the console functions, copy them if they exist, stub if not
    NAMES.forEach(function(name) {
        if (window.console && window.console[name]) {
            exports[name] = Function.prototype.bind.call(window.console[name], window.console);
        } else {
            exports[name] = noop;
        }
    });
}

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/canon', function(require, exports, module) {

var console = require('pilot/console');
var Trace = require('pilot/stacktrace').Trace;
var oop = require('pilot/oop');
var EventEmitter = require('pilot/event_emitter').EventEmitter;
var catalog = require('pilot/catalog');
var Status = require('pilot/types').Status;
var types = require('pilot/types');
var lang = require('pilot/lang');

/*
// TODO: this doesn't belong here - or maybe anywhere?
var dimensionsChangedExtensionSpec = {
    name: 'dimensionsChanged',
    description: 'A dimensionsChanged is a way to be notified of ' +
            'changes to the dimension of Skywriter'
};
exports.startup = function(data, reason) {
    catalog.addExtensionSpec(commandExtensionSpec);
};
exports.shutdown = function(data, reason) {
    catalog.removeExtensionSpec(commandExtensionSpec);
};
*/

var commandExtensionSpec = {
    name: 'command',
    description: 'A command is a bit of functionality with optional ' +
            'typed arguments which can do something small like moving ' +
            'the cursor around the screen, or large like cloning a ' +
            'project from VCS.',
    indexOn: 'name'
};

exports.startup = function(data, reason) {
    // TODO: this is probably all kinds of evil, but we need something working
    catalog.addExtensionSpec(commandExtensionSpec);
};

exports.shutdown = function(data, reason) {
    catalog.removeExtensionSpec(commandExtensionSpec);
};

/**
 * Manage a list of commands in the current canon
 */

/**
 * A Command is a discrete action optionally with a set of ways to customize
 * how it happens. This is here for documentation purposes.
 * TODO: Document better
 */
var thingCommand = {
    name: 'thing',
    description: 'thing is an example command',
    params: [{
        name: 'param1',
        description: 'an example parameter',
        type: 'text',
        defaultValue: null
    }],
    exec: function(env, args, request) {
        thing();
    }
};

/**
 * A lookup hash of our registered commands
 */
var commands = {};

/**
 * A sorted list of command names, we regularly want them in order, so pre-sort
 */
var commandNames = [];

/**
 * This registration method isn't like other Ace registration methods because
 * it doesn't return a decorated command because there is no functional
 * decoration to be done.
 * TODO: Are we sure that in the future there will be no such decoration?
 */
function addCommand(command) {
    if (!command.name) {
        throw new Error('All registered commands must have a name');
    }
    if (command.params == null) {
        command.params = [];
    }
    if (!Array.isArray(command.params)) {
        throw new Error('command.params must be an array in ' + command.name);
    }
    // Replace the type
    command.params.forEach(function(param) {
        if (!param.name) {
            throw new Error('In ' + command.name + ': all params must have a name');
        }
        upgradeType(command.name, param);
    }, this);
    commands[command.name] = command;

    commandNames.push(command.name);
    commandNames.sort();
};

function upgradeType(name, param) {
    var lookup = param.type;
    param.type = types.getType(lookup);
    if (param.type == null) {
        throw new Error('In ' + name + '/' + param.name +
            ': can\'t find type for: ' + JSON.stringify(lookup));
    }
}

function removeCommand(command) {
    var name = (typeof command === 'string' ? command : command.name);
    delete commands[name];
    lang.arrayRemove(commandNames, name);
};

function getCommand(name) {
    return commands[name];
};

function getCommandNames() {
    return commandNames;
};

/**
 * Entry point for keyboard accelerators or anything else that knows
 * everything it needs to about the command params
 * @param command Either a command, or the name of one
 */
function exec(command, env, args, typed) {
    if (typeof command === 'string') {
        command = commands[command];
    }
    if (!command) {
        // TODO: Should we complain more than returning false?
        return false;
    }

    var request = new Request({
        command: command,
        args: args,
        typed: typed
    });
    command.exec(env, args || {}, request);
    return true;
};

exports.removeCommand = removeCommand;
exports.addCommand = addCommand;
exports.getCommand = getCommand;
exports.getCommandNames = getCommandNames;
exports.exec = exec;
exports.upgradeType = upgradeType;


/**
 * We publish a 'output' event whenever new command begins output
 * TODO: make this more obvious
 */
oop.implement(exports, EventEmitter);


/**
 * Current requirements are around displaying the command line, and provision
 * of a 'history' command and cursor up|down navigation of history.
 * <p>Future requirements could include:
 * <ul>
 * <li>Multiple command lines
 * <li>The ability to recall key presses (i.e. requests with no output) which
 * will likely be needed for macro recording or similar
 * <li>The ability to store the command history either on the server or in the
 * browser local storage.
 * </ul>
 * <p>The execute() command doesn't really live here, except as part of that
 * last future requirement, and because it doesn't really have anywhere else to
 * live.
 */

/**
 * The array of requests that wish to announce their presence
 */
var requests = [];

/**
 * How many requests do we store?
 */
var maxRequestLength = 100;

/**
 * To create an invocation, you need to do something like this (all the ctor
 * args are optional):
 * <pre>
 * var request = new Request({
 *     command: command,
 *     args: args,
 *     typed: typed
 * });
 * </pre>
 * @constructor
 */
function Request(options) {
    options = options || {};

    // Will be used in the keyboard case and the cli case
    this.command = options.command;

    // Will be used only in the cli case
    this.args = options.args;
    this.typed = options.typed;

    // Have we been initialized?
    this._begunOutput = false;

    this.start = new Date();
    this.end = null;
    this.completed = false;
    this.error = false;
};

oop.implement(Request.prototype, EventEmitter);

/**
 * Lazy init to register with the history should only be done on output.
 * init() is expensive, and won't be used in the majority of cases
 */
Request.prototype._beginOutput = function() {
    this._begunOutput = true;
    this.outputs = [];

    requests.push(this);
    // This could probably be optimized with some maths, but 99.99% of the
    // time we will only be off by one, and I'm feeling lazy.
    while (requests.length > maxRequestLength) {
        requests.shiftObject();
    }

    exports._dispatchEvent('output', { requests: requests, request: this });
};

/**
 * Sugar for:
 * <pre>request.error = true; request.done(output);</pre>
 */
Request.prototype.doneWithError = function(content) {
    this.error = true;
    this.done(content);
};

/**
 * Declares that this function will not be automatically done when
 * the command exits
 */
Request.prototype.async = function() {
    if (!this._begunOutput) {
        this._beginOutput();
    }
};

/**
 * Complete the currently executing command with successful output.
 * @param output Either DOM node, an SproutCore element or something that
 * can be used in the content of a DIV to create a DOM node.
 */
Request.prototype.output = function(content) {
    if (!this._begunOutput) {
        this._beginOutput();
    }

    if (typeof content !== 'string' && !(content instanceof Node)) {
        content = content.toString();
    }

    this.outputs.push(content);
    this._dispatchEvent('output', {});

    return this;
};

/**
 * All commands that do output must call this to indicate that the command
 * has finished execution.
 */
Request.prototype.done = function(content) {
    this.completed = true;
    this.end = new Date();
    this.duration = this.end.getTime() - this.start.getTime();

    if (content) {
        this.output(content);
    }

    this._dispatchEvent('output', {});
};
exports.Request = Request;


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Patrick Walton (pwalton@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/rangeutils', function(require, exports, module) {

var util = require("util/util");

/**
 * Returns the result of adding the two positions.
 */
exports.addPositions = function(a, b) {
    return { row: a.row + b.row, col: a.col + b.col };
};

/** Returns a copy of the given range. */
exports.cloneRange = function(range) {
    var oldStart = range.start, oldEnd = range.end;
    var newStart = { row: oldStart.row, col: oldStart.col };
    var newEnd = { row: oldEnd.row, col: oldEnd.col };
    return { start: newStart, end: newEnd };
};

/**
 * Given two positions a and b, returns a negative number if a < b, 0 if a = b,
 * or a positive number if a > b.
 */
exports.comparePositions = function(positionA, positionB) {
    var rowDiff = positionA.row - positionB.row;
    return rowDiff === 0 ? positionA.col - positionB.col : rowDiff;
};

/**
 * Returns true if the two ranges are equal and false otherwise.
 */
exports.equal = function(rangeA, rangeB) {
    return (exports.comparePositions(rangeA.start, rangeB.start) === 0 &&
                exports.comparePositions(rangeA.end, rangeB.end) === 0);
};

exports.extendRange = function(range, delta) {
    var end = range.end;
    return {
        start: range.start,
        end:   {
            row: end.row + delta.row,
            col: end.col + delta.col
        }
    };
};

/**
 * Given two sets of ranges, returns the ranges of characters that exist in one
 * of the sets but not both.
 */
exports.intersectRangeSets = function(setA, setB) {
    var stackA = util.clone(setA), stackB = util.clone(setB);
    var result = [];
    while (stackA.length > 0 && stackB.length > 0) {
        var rangeA = stackA.shift(), rangeB = stackB.shift();
        var startDiff = exports.comparePositions(rangeA.start, rangeB.start);
        var endDiff = exports.comparePositions(rangeA.end, rangeB.end);

        if (exports.comparePositions(rangeA.end, rangeB.start) < 0) {
            // A is completely before B
            result.push(rangeA);
            stackB.unshift(rangeB);
        } else if (exports.comparePositions(rangeB.end, rangeA.start) < 0) {
            // B is completely before A
            result.push(rangeB);
            stackA.unshift(rangeA);
        } else if (startDiff < 0) {     // A starts before B
            result.push({ start: rangeA.start, end: rangeB.start });
            stackA.unshift({ start: rangeB.start, end: rangeA.end });
            stackB.unshift(rangeB);
        } else if (startDiff === 0) {   // A and B start at the same place
            if (endDiff < 0) {          // A ends before B
                stackB.unshift({ start: rangeA.end, end: rangeB.end });
            } else if (endDiff > 0) {   // A ends after B
                stackA.unshift({ start: rangeB.end, end: rangeA.end });
            }
        } else if (startDiff > 0) {     // A starts after B
            result.push({ start: rangeB.start, end: rangeA.start });
            stackA.unshift(rangeA);
            stackB.unshift({ start: rangeA.start, end: rangeB.end });
        }
    }
    return result.concat(stackA, stackB);
};

exports.isZeroLength = function(range) {
    return range.start.row === range.end.row &&
        range.start.col === range.end.col;
};

/**
 * Returns the greater of the two positions.
 */
exports.maxPosition = function(a, b) {
    return exports.comparePositions(a, b) > 0 ? a : b;
};

/**
 * Converts a range with swapped 'end' and 'start' values into one with the
 * values in the correct order.
 *
 * TODO: Unit test.
 */
exports.normalizeRange = function(range) {
    return this.comparePositions(range.start, range.end) < 0 ? range :
        { start: range.end, end: range.start };
};

/**
 * Returns a single range that spans the entire given set of ranges.
 */
exports.rangeSetBoundaries = function(rangeSet) {
    return {
        start:  rangeSet[0].start,
        end:    rangeSet[rangeSet.length - 1].end
    };
};

exports.toString = function(range) {
    var start = range.start, end = range.end;
    return '[ ' + start.row + ', ' + start.col + ' ' + end.row + ',' + + end.col +' ]';
};

/**
 * Returns the union of the two ranges.
 */
exports.unionRanges = function(a, b) {
    return {
        start:  a.start.row < b.start.row ||
            (a.start.row === b.start.row && a.start.col < b.start.col) ?
            a.start : b.start,
        end:    a.end.row > b.end.row ||
            (a.end.row === b.end.row && a.end.col > b.end.col) ?
            a.end : b.end
    };
};

exports.isPosition = function(pos) {
    return !util.none(pos) && !util.none(pos.row) && !util.none(pos.col);
};

exports.isRange = function(range) {
    return (!util.none(range) && exports.isPosition(range.start) &&
                                                exports.isPosition(range.end));
};

});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/index', function(require, exports, module) {

exports.startup = function(data, reason) {
    require('pilot/fixoldbrowsers');

    require('pilot/types/basic').startup(data, reason);
    require('pilot/types/command').startup(data, reason);
    require('pilot/types/settings').startup(data, reason);
    require('pilot/commands/settings').startup(data, reason);
    require('pilot/commands/basic').startup(data, reason);
    // require('pilot/commands/history').startup(data, reason);
    require('pilot/settings/canon').startup(data, reason);
    require('pilot/canon').startup(data, reason);
};

exports.shutdown = function(data, reason) {
    require('pilot/types/basic').shutdown(data, reason);
    require('pilot/types/command').shutdown(data, reason);
    require('pilot/types/settings').shutdown(data, reason);
    require('pilot/commands/settings').shutdown(data, reason);
    require('pilot/commands/basic').shutdown(data, reason);
    // require('pilot/commands/history').shutdown(data, reason);
    require('pilot/settings/canon').shutdown(data, reason);
    require('pilot/canon').shutdown(data, reason);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/settings/canon', function(require, exports, module) {


var historyLengthSetting = {
    name: "historyLength",
    description: "How many typed commands do we recall for reference?",
    type: "number",
    defaultValue: 50
};

exports.startup = function(data, reason) {
    data.env.settings.addSetting(historyLengthSetting);
};

exports.shutdown = function(data, reason) {
    data.env.settings.removeSetting(historyLengthSetting);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Julian Viereck (jviereck@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/proxy', function(require, exports, module) {

var Promise = require('pilot/promise').Promise;

exports.xhr = function(method, url, async, beforeSendCallback) {
    var pr = new Promise();

    if (!skywriter.proxy || !skywriter.proxy.xhr) {
        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState !== 4) {
                return;
            }

            var status = req.status;
            if (status !== 0 && status !== 200) {
                var error = new Error(req.responseText + ' (Status ' + req.status + ")");
                error.xhr = req;
                pr.reject(error);
                return;
            }

            pr.resolve(req.responseText);
        }.bind(this);

        req.open("GET", url, async);
        if (beforeSendCallback) {
            beforeSendCallback(req);
        }
        req.send();
    } else {
        skywriter.proxy.xhr.call(this, method, url, async, beforeSendCallback, pr);
    }

    return pr;
};

exports.Worker = function(url) {
    if (!skywriter.proxy || !skywriter.proxy.worker) {
        return new Worker(url);
    } else {
        return new skywriter.proxy.worker(url);
    }
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Skywriter Team (skywriter@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/commands/history', function(require, exports, module) {


/**
 * CLI 'up'
 * Decrement the 'current entry' pointer
 */
var historyPreviousCommandSpec = {
    name: "historyPrevious",
    predicates: { isCommandLine: true, isKeyUp: true },
    key: "up",
    exec: function(args, request) {
        if (pointer > 0) {
            pointer--;
        }

        var display = history.requests[pointer].typed;
        env.commandLine.setInput(display);
    }
};

/**
 * CLI 'down'
 * Increment the 'current entry' pointer
 */
var historyNextCommandSpec = {
    name: "historyNext",
    predicates: { isCommandLine: true, isKeyUp: true },
    key: "down",
    exec: function(args, request) {
        if (pointer < history.requests.length) {
            pointer++;
        }

        var display = (pointer === history.requests.length)
            ? ''
            : history.requests[pointer].typed;

        env.commandLine.setInput(display);
    }
};

/**
 * 'history' command
 */
var historyCommandSpec = {
    name: "history",
    description: "Show history of the commands",
    exec: function(args, request) {
        var output = [];
        output.push('<table>');
        var count = 1;

        history.requests.forEach(function(request) {
            output.push('<tr>');
            output.push('<th>' + count + '</th>');
            output.push('<td>' + request.typed + '</td>');
            output.push('</tr>');
            count++;
        });
        output.push('</table>');

        request.done(output.join(''));
    }
};

/**
 * The pointer to the command that we show on up|down
 */
var pointer = 0;

/**
 * Reset the pointer to the latest command execution
 */
exports.addedRequestOutput = function() {
    pointer = history.requests.length;
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Skywriter Team (skywriter@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/commands/basic', function(require, exports, module) {


var checks = require("pilot/typecheck");
var canon = require('pilot/canon');

/**
 * 
 */
var helpMessages = {
    plainPrefix:
        '<h2>Welcome to Skywriter - Code in the Cloud</h2><ul>' +
        '<li><a href="http://labs.mozilla.com/projects/skywriter" target="_blank">Home Page</a></li>' +
        '<li><a href="https://wiki.mozilla.org/Labs/Skywriter" target="_blank">Wiki</a></li>' +
        '<li><a href="https://wiki.mozilla.org/Labs/Skywriter/UserGuide" target="_blank">User Guide</a></li>' +
        '<li><a href="https://wiki.mozilla.org/Labs/Skywriter/Tips" target="_blank">Tips and Tricks</a></li>' +
        '<li><a href="https://wiki.mozilla.org/Labs/Skywriter/FAQ" target="_blank">FAQ</a></li>' +
        '<li><a href="https://wiki.mozilla.org/Labs/Skywriter/DeveloperGuide" target="_blank">Developers Guide</a></li>' +
        '</ul>',
    plainSuffix:
        'For more information, see the <a href="https://wiki.mozilla.org/Labs/Skywriter">Skywriter Wiki</a>.'
};

/**
 * 'help' command
 */
var helpCommandSpec = {
    name: 'help',
    params: [
        {
            name: 'search',
            type: 'text',
            description: 'Search string to narrow the output.',
            defaultValue: null
        }
    ],
    description: 'Get help on the available commands.',
    exec: function(env, args, request) {
        var output = [];

        var command = canon.getCommand(args.search);
        if (command && command.exec) {
            // caught a real command
            output.push(command.description ?
                    command.description :
                    'No description for ' + args.search);
        } else {
            var showHidden = false;

            if (!args.search && helpMessages.plainPrefix) {
                output.push(helpMessages.plainPrefix);
            }

            if (command) {
                // We must be looking at sub-commands
                output.push('<h2>Sub-Commands of ' + command.name + '</h2>');
                output.push('<p>' + command.description + '</p>');
            }
            else if (args.search) {
                if (args.search == 'hidden') { // sneaky, sneaky.
                    args.search = '';
                    showHidden = true;
                }
                output.push('<h2>Commands starting with \'' + args.search + '\':</h2>');
            }
            else {
                output.push('<h2>Available Commands:</h2>');
            }

            var commandNames = canon.getCommandNames();
            commandNames.sort();

            output.push('<table>');
            for (var i = 0; i < commandNames.length; i++) {
                command = canon.getCommand(commandNames[i]);
                if (!showHidden && command.hidden) {
                    continue;
                }
                if (command.description === undefined) {
                    // Ignore editor actions
                    continue;
                }
                if (args.search && command.name.indexOf(args.search) !== 0) {
                    // Filtered out by the user
                    continue;
                }
                if (!args.search && command.name.indexOf(' ') != -1) {
                    // sub command
                    continue;
                }
                if (command && command.name == args.search) {
                    // sub command, and we've already given that help
                    continue;
                }

                // todo add back a column with parameter information, perhaps?

                output.push('<tr>');
                output.push('<th class="right">' + command.name + '</th>');
                output.push('<td>' + command.description + '</td>');
                output.push('</tr>');
            }
            output.push('</table>');

            if (!args.search && helpMessages.plainSuffix) {
                output.push(helpMessages.plainSuffix);
            }
        }

        request.done(output.join(''));
    }
};

/**
 * 'eval' command
 */
var evalCommandSpec = {
    name: 'eval',
    params: [
        {
            name: 'javascript',
            type: 'text',
            description: 'The JavaScript to evaluate'
        }
    ],
    description: 'evals given js code and show the result',
    hidden: true,
    exec: function(env, args, request) {
        var result;
        var javascript = args.javascript;
        try {
            result = eval(javascript);
        } catch (e) {
            result = '<b>Error: ' + e.message + '</b>';
        }

        var msg = '';
        var type = '';
        var x;

        if (checks.isFunction(result)) {
            // converts the function to a well formated string
            msg = (result + '').replace(/\n/g, '<br>').replace(/ /g, '&#160');
            type = 'function';
        } else if (checks.isObject(result)) {
            if (Array.isArray(result)) {
                type = 'array';
            } else {
                type = 'object';
            }

            var items = [];
            var value;

            for (x in result) {
                if (result.hasOwnProperty(x)) {
                    if (checks.isFunction(result[x])) {
                        value = '[function]';
                    } else if (checks.isObject(result[x])) {
                        value = '[object]';
                    } else {
                        value = result[x];
                    }

                    items.push({name: x, value: value});
                }
            }

            items.sort(function(a,b) {
                return (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 1;
            });

            for (x = 0; x < items.length; x++) {
                msg += '<b>' + items[x].name + '</b>: ' + items[x].value + '<br>';
            }

        } else {
            msg = result;
            type = typeof result;
        }

        request.done('Result for eval <b>\'' + javascript + '\'</b>' +
                ' (type: '+ type+'): <br><br>'+ msg);
    }
};

/**
 * 'version' command
 */
var versionCommandSpec = {
    name: 'version',
    description: 'show the Skywriter version',
    hidden: true,
    exec: function(env, args, request) {
        var version = 'Skywriter ' + skywriter.versionNumber + ' (' +
                skywriter.versionCodename + ')';
        request.done(version);
    }
};

/**
 * 'skywriter' command
 */
var skywriterCommandSpec = {
    name: 'skywriter',
    hidden: true,
    exec: function(env, args, request) {
        var index = Math.floor(Math.random() * messages.length);
        request.done('Skywriter ' + messages[index]);
    }
};
var messages = [
    'really wants you to trick it out in some way.',
    'is your Web editor.',
    'would love to be like Emacs on the Web.',
    'is written on the Web platform, so you can tweak it.'
];


var canon = require('pilot/canon');

exports.startup = function(data, reason) {
    canon.addCommand(helpCommandSpec);
    canon.addCommand(evalCommandSpec);
    // canon.addCommand(versionCommandSpec);
    canon.addCommand(skywriterCommandSpec);
};

exports.shutdown = function(data, reason) {
    canon.removeCommand(helpCommandSpec);
    canon.removeCommand(evalCommandSpec);
    // canon.removeCommand(versionCommandSpec);
    canon.removeCommand(skywriterCommandSpec);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Skywriter Team (skywriter@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/commands/settings', function(require, exports, module) {


var setCommandSpec = {
    name: 'set',
    params: [
        {
            name: 'setting',
            type: 'setting',
            description: 'The name of the setting to display or alter',
            defaultValue: null
        },
        {
            name: 'value',
            type: 'settingValue',
            description: 'The new value for the chosen setting',
            defaultValue: null
        }
    ],
    description: 'define and show settings',
    exec: function(env, args, request) {
        var html;
        if (!args.setting) {
            // 'set' by itself lists all the settings
            var names = env.settings.getSettingNames();
            html = '';
            // first sort the settingsList based on the name
            names.sort(function(name1, name2) {
                return name1.localeCompare(name2);
            });

            names.forEach(function(name) {
                var setting = env.settings.getSetting(name);
                var url = 'https://wiki.mozilla.org/Labs/Skywriter/Settings#' +
                        setting.name;
                html += '<a class="setting" href="' + url +
                        '" title="View external documentation on setting: ' +
                        setting.name +
                        '" target="_blank">' +
                        setting.name +
                        '</a> = ' +
                        setting.value +
                        '<br/>';
            });
        } else {
            // set with only a setting, shows the value for that setting
            if (args.value === undefined) {
                html = '<strong>' + setting.name + '</strong> = ' +
                        setting.get();
            } else {
                // Actually change the setting
                args.setting.set(args.value);
                html = 'Setting: <strong>' + args.setting.name + '</strong> = ' +
                        args.setting.get();
            }
        }
        request.done(html);
    }
};

var unsetCommandSpec = {
    name: 'unset',
    params: [
        {
            name: 'setting',
            type: 'setting',
            description: 'The name of the setting to return to defaults'
        }
    ],
    description: 'unset a setting entirely',
    exec: function(env, args, request) {
        var setting = env.settings.get(args.setting);
        if (!setting) {
            request.doneWithError('No setting with the name <strong>' +
                args.setting + '</strong>.');
            return;
        }

        setting.reset();
        request.done('Reset ' + setting.name + ' to default: ' +
                env.settings.get(args.setting));
    }
};

var canon = require('pilot/canon');

exports.startup = function(data, reason) {
    canon.addCommand(setCommandSpec);
    canon.addCommand(unsetCommandSpec);
};

exports.shutdown = function(data, reason) {
    canon.removeCommand(setCommandSpec);
    canon.removeCommand(unsetCommandSpec);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is DomTemplate.
 *
 * The Initial Developer of the Original Code is Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com) (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/environment', function(require, exports, module) {


var settings = require("pilot/settings").settings;

/**
 * Create an environment object
 */
function create() {
    return {
        settings: settings
    };
};

exports.create = create;


});
/*! @license
==========================================================================
SproutCore -- JavaScript Application Framework
copyright 2006-2009, Sprout Systems Inc., Apple Inc. and contributors.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

SproutCore and the SproutCore logo are trademarks of Sprout Systems, Inc.

For more information about SproutCore, visit http://www.sproutcore.com


==========================================================================
@license */

// Most of the following code is taken from SproutCore with a few changes.

define('pilot/keys', function(require, exports, module) {

var oop = require("pilot/oop");

/**
 * Helper functions and hashes for key handling.
 */
var Keys = (function() {
    var ret = {
        MODIFIER_KEYS: {
            16: 'Shift', 17: 'Ctrl', 18: 'Alt', 224: 'Meta',
        },

        KEY_MODS: {
            "ctrl": 1, "alt": 2, "option" : 2,
            "shift": 4, "meta": 8, "command": 8
        },

        FUNCTION_KEYS : {
            8  : "Backspace",
            9  : "Tab",
            13 : "Return",
            19 : "Pause",
            27 : "Esc",
            32 : "Space",
            33 : "PageUp",
            34 : "PageDown",
            35 : "End",
            36 : "Home",
            37 : "Left",
            38 : "Up",
            39 : "Right",
            40 : "Down",
            44 : "Print",
            45 : "Insert",
            46 : "Delete",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "Numlock",
            145: "Scrolllock"
        },

        PRINTABLE_KEYS: {
           32: ' ',  48: '0',  49: '1',  50: '2',  51: '3',  52: '4', 53:  '5',
           54: '6',  55: '7',  56: '8',  57: '9',  59: ';',  61: '=', 65:  'a',
           66: 'b',  67: 'c',  68: 'd',  69: 'e',  70: 'f',  71: 'g', 72:  'h',
           73: 'i',  74: 'j',  75: 'k',  76: 'l',  77: 'm',  78: 'n', 79:  'o',
           80: 'p',  81: 'q',  82: 'r',  83: 's',  84: 't',  85: 'u', 86:  'v',
           87: 'w',  88: 'x',  89: 'y',  90: 'z', 107: '+', 109: '-', 110: '.',
          188: ',', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\',
          221: ']', 222: '\"'
        }
    };

    // A reverse map of FUNCTION_KEYS
    for (i in ret.FUNCTION_KEYS) {
        var name = ret.FUNCTION_KEYS[i].toUpperCase();
        ret[name] = parseInt(i, 10);
    }

    // Add the MODIFIER_KEYS, FUNCTION_KEYS and PRINTABLE_KEYS to the KEY
    // variables as well.
    oop.mixin(ret, ret.MODIFIER_KEYS);
    oop.mixin(ret, ret.PRINTABLE_KEYS);
    oop.mixin(ret, ret.FUNCTION_KEYS);

    return ret;
})();
oop.mixin(exports, Keys);

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Joe Walker (jwalker@mozilla.com)
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/types/basic', function(require, exports, module) {

var types = require("pilot/types");
var Type = types.Type;
var Conversion = types.Conversion;
var Status = types.Status;

/**
 * These are the basic types that we accept. They are vaguely based on the
 * Jetpack settings system (https://wiki.mozilla.org/Labs/Jetpack/JEP/24)
 * although clearly more restricted.
 *
 * <p>In addition to these types, Jetpack also accepts range, member, password
 * that we are thinking of adding.
 *
 * <p>This module probably should not be accessed directly, but instead used
 * through types.js
 */

/**
 * 'text' is the default if no type is given.
 */
var text = new Type();

text.stringify = function(value) {
    return value;
};

text.parse = function(value) {
    if (typeof value != 'string') {
        throw new Error('non-string passed to text.parse()');
    }
    return new Conversion(value);
};

text.name = 'text';

/**
 * We don't currently plan to distinguish between integers and floats
 */
var number = new Type();

number.stringify = function(value) {
    if (!value) {
        return null;
    }
    return '' + value;
};

number.parse = function(value) {
    if (typeof value != 'string') {
        throw new Error('non-string passed to number.parse()');
    }

    if (value.replace(/\s/g, '').length === 0) {
        return new Conversion(null, Status.INCOMPLETE, '');
    }

    var reply = new Conversion(parseInt(value, 10));
    if (isNaN(reply.value)) {
        reply.status = Status.INVALID;
        reply.message = 'Can\'t convert "' + value + '" to a number.';
    }

    return reply;
};

number.decrement = function(value) {
    return value - 1;
};

number.increment = function(value) {
    return value + 1;
};

number.name = 'number';

/**
 * One of a known set of options
 */
function SelectionType(typeSpec) {
    if (!Array.isArray(typeSpec.data) && typeof typeSpec.data !== 'function') {
        throw new Error('instances of SelectionType need typeSpec.data to be an array or function that returns an array:' + JSON.stringify(typeSpec));
    }
    Object.keys(typeSpec).forEach(function(key) {
        this[key] = typeSpec[key];
    }, this);
};

SelectionType.prototype = new Type();

SelectionType.prototype.stringify = function(value) {
    return value;
};

SelectionType.prototype.parse = function(str) {
    if (typeof str != 'string') {
        throw new Error('non-string passed to parse()');
    }
    if (!this.data) {
        throw new Error('Missing data on selection type extension.');
    }
    var data = (typeof(this.data) === 'function') ? this.data() : this.data;

    // The matchedValue could be the boolean value false
    var hasMatched = false;
    var matchedValue;
    var completions = [];
    data.forEach(function(option) {
        if (str == option) {
            matchedValue = this.fromString(option);
            hasMatched = true;
        }
        else if (option.indexOf(str) === 0) {
            completions.push(this.fromString(option));
        }
    }, this);

    if (hasMatched) {
        return new Conversion(matchedValue);
    }
    else {
        // This is something of a hack it basically allows us to tell the
        // setting type to forget its last setting hack.
        if (this.noMatch) {
            this.noMatch();
        }

        if (completions.length > 0) {
            var msg = 'Possibilities' +
                (str.length === 0 ? '' : ' for \'' + str + '\'');
            return new Conversion(null, Status.INCOMPLETE, msg, completions);
        }
        else {
            var msg = 'Can\'t use \'' + str + '\'.';
            return new Conversion(null, Status.INVALID, msg, completions);
        }
    }
};

SelectionType.prototype.fromString = function(str) {
    return str;
};

SelectionType.prototype.decrement = function(value) {
    var data = (typeof this.data === 'function') ? this.data() : this.data;
    var index;
    if (value == null) {
        index = data.length - 1;
    }
    else {
        var name = this.stringify(value);
        var index = data.indexOf(name);
        index = (index === 0 ? data.length - 1 : index - 1);
    }
    return this.fromString(data[index]);
};

SelectionType.prototype.increment = function(value) {
    var data = (typeof this.data === 'function') ? this.data() : this.data;
    var index;
    if (value == null) {
        index = 0;
    }
    else {
        var name = this.stringify(value);
        var index = data.indexOf(name);
        index = (index === data.length - 1 ? 0 : index + 1);
    }
    return this.fromString(data[index]);
};

SelectionType.prototype.name = 'selection';

/**
 * SelectionType is a base class for other types
 */
exports.SelectionType = SelectionType;

/**
 * true/false values
 */
var bool = new SelectionType({
    name: 'bool',
    data: [ 'true', 'false' ],
    stringify: function(value) {
        return '' + value;
    },
    fromString: function(str) {
        return str === 'true' ? true : false;
    }
});


/**
 * A we don't know right now, but hope to soon.
 */
function DeferredType(typeSpec) {
    if (typeof typeSpec.defer !== 'function') {
        throw new Error('Instances of DeferredType need typeSpec.defer to be a function that returns a type');
    }
    Object.keys(typeSpec).forEach(function(key) {
        this[key] = typeSpec[key];
    }, this);
};

DeferredType.prototype = new Type();

DeferredType.prototype.stringify = function(value) {
    return this.defer().stringify(value);
};

DeferredType.prototype.parse = function(value) {
    return this.defer().parse(value);
};

DeferredType.prototype.decrement = function(value) {
    var deferred = this.defer();
    return (deferred.decrement ? deferred.decrement(value) : undefined);
};

DeferredType.prototype.increment = function(value) {
    var deferred = this.defer();
    return (deferred.increment ? deferred.increment(value) : undefined);
};

DeferredType.prototype.name = 'deferred';

/**
 * DeferredType is a base class for other types
 */
exports.DeferredType = DeferredType;


/**
 * A set of objects of the same type
 */
function ArrayType(typeSpec) {
    if (typeSpec instanceof Type) {
        this.subtype = typeSpec;
    }
    else if (typeof typeSpec === 'string') {
        this.subtype = types.getType(typeSpec);
        if (this.subtype == null) {
            throw new Error('Unknown array subtype: ' + typeSpec);
        }
    }
    else {
        throw new Error('Can\' handle array subtype');
    }
};

ArrayType.prototype = new Type();

ArrayType.prototype.stringify = function(values) {
    // TODO: Check for strings with spaces and add quotes
    return values.join(' ');
};

ArrayType.prototype.parse = function(value) {
    return this.defer().parse(value);
};

ArrayType.prototype.name = 'array';

/**
 * Registration and de-registration.
 */
exports.startup = function() {
    types.registerType(text);
    types.registerType(number);
    types.registerType(bool);
    types.registerType(SelectionType);
    types.registerType(DeferredType);
    types.registerType(ArrayType);
};

exports.shutdown = function() {
    types.unregisterType(text);
    types.unregisterType(number);
    types.unregisterType(bool);
    types.unregisterType(SelectionType);
    types.unregisterType(DeferredType);
    types.unregisterType(ArrayType);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Joe Walker (jwalker@mozilla.com)
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/types/command', function(require, exports, module) {

var canon = require("pilot/canon");
var SelectionType = require("pilot/types/basic").SelectionType;
var types = require("pilot/types");


/**
 * Select from the available commands
 */
var command = new SelectionType({
    name: 'command',
    data: function() {
        return canon.getCommandNames();
    },
    stringify: function(command) {
        return command.name;
    },
    fromString: function(str) {
        return canon.getCommand(str);
    }
});


/**
 * Registration and de-registration.
 */
exports.startup = function() {
    types.registerType(command);
};

exports.shutdown = function() {
    types.unregisterType(command);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Joe Walker (jwalker@mozilla.com)
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/types/settings', function(require, exports, module) {

var SelectionType = require('pilot/types/basic').SelectionType;
var DeferredType = require('pilot/types/basic').DeferredType;
var types = require('pilot/types');
var settings = require('pilot/settings').settings;


/**
 * EVIL: This relies on us using settingValue in the same event as setting
 * The alternative is to have some central place where we store the current
 * command line, but this might be a lesser evil for now.
 */
var lastSetting;

/**
 * Select from the available settings
 */
var setting = new SelectionType({
    name: 'setting',
    data: function() {
        return env.settings.getSettingNames();
    },
    stringify: function(setting) {
        lastSetting = setting;
        return setting.name;
    },
    fromString: function(str) {
        lastSetting = settings.getSetting(str);
        return lastSetting;
    },
    noMatch: function() {
        lastSetting = null;
    }
});

/**
 * Something of a hack to allow the set command to give a clearer definition
 * of the type to the command line.
 */
var settingValue = new DeferredType({
    name: 'settingValue',
    defer: function() {
        if (lastSetting) {
            return lastSetting.type;
        }
        else {
            return types.getType('text');
        }
    },
    /**
     * Promote the current value in any list of predictions, and add it if
     * there are none.
     */
    getDefault: function() {
        var conversion = this.parse('');
        if (lastSetting) {
            var current = lastSetting.get();
            if (conversion.predictions.length === 0) {
                conversion.predictions.push(current);
            }
            else {
                // Remove current from predictions
                var removed = false;
                while (true) {
                    var index = conversion.predictions.indexOf(current);
                    if (index === -1) {
                        break;
                    }
                    conversion.predictions.splice(index, 1);
                    removed = true;
                }
                // If the current value wasn't something we would predict, leave it
                if (removed) {
                    conversion.predictions.push(current);
                }
            }
        }
        return conversion;
    }
});

var env;

/**
 * Registration and de-registration.
 */
exports.startup = function(data, reason) {
    // TODO: this is probably all kinds of evil, but we need something working
    env = data.env;
    types.registerType(setting);
    types.registerType(settingValue);
};

exports.shutdown = function(data, reason) {
    types.unregisterType(setting);
    types.unregisterType(settingValue);
};


});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *   Julian Viereck (jviereck@mozilla.com)
 *   Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/settings', function(require, exports, module) {

/**
 * This plug-in manages settings.
 */

var console = require('pilot/console');
var oop = require('pilot/oop');
var types = require('pilot/types');
var EventEmitter = require('pilot/event_emitter').EventEmitter;
var catalog = require('pilot/catalog');

var settingExtensionSpec = {
    name: 'setting',
    description: 'A setting is something that the application offers as a ' +
            'way to customize how it works',
    register: 'env.settings.addSetting',
    indexOn: 'name'
};

exports.startup = function(data, reason) {
    catalog.addExtensionSpec(settingExtensionSpec);
};

exports.shutdown = function(data, reason) {
    catalog.removeExtensionSpec(settingExtensionSpec);
};


/**
 * Create a new setting.
 * @param settingSpec An object literal that looks like this:
 * {
 *   name: 'thing',
 *   description: 'Thing is an example setting',
 *   type: 'string',
 *   defaultValue: 'something'
 * }
 */
function Setting(settingSpec, settings) {
    this._settings = settings;

    Object.keys(settingSpec).forEach(function(key) {
        this[key] = settingSpec[key];
    }, this);

    this.type = types.getType(this.type);
    if (this.type == null) {
        throw new Error('In ' + this.name +
            ': can\'t find type for: ' + JSON.stringify(settingSpec.type));
    }

    if (!this.name) {
        throw new Error('Setting.name == undefined. Ignoring.', this);
    }

    if (!this.defaultValue === undefined) {
        throw new Error('Setting.defaultValue == undefined', this);
    }

    this.value = this.defaultValue;
}
Setting.prototype = {
    get: function() {
        return this.value;
    },

    set: function(value) {
        if (this.value === value) {
            return;
        }

        this.value = value;
        if (this._settings.persister) {
            this._settings.persister.persistValue(this._settings, this.name, value);
        }

        this._dispatchEvent('change', { setting: this, value: value });
    },

    /**
     * Reset the value of the <code>key</code> setting to it's default
     */
    resetValue: function() {
        this.set(this.defaultValue);
    }
};
oop.implement(Setting.prototype, EventEmitter);


/**
 * A base class for all the various methods of storing settings.
 * <p>Usage:
 * <pre>
 * // Create manually, or require 'settings' from the container.
 * // This is the manual version:
 * var settings = plugins.catalog.getObject('settings');
 * // Add a new setting
 * settings.addSetting({ name:'foo', ... });
 * // Display the default value
 * alert(settings.get('foo'));
 * // Alter the value, which also publishes the change etc.
 * settings.set('foo', 'bar');
 * // Reset the value to the default
 * settings.resetValue('foo');
 * </pre>
 * @constructor
 */
function Settings(persister) {
    // Storage for deactivated values
    this._deactivated = {};

    // Storage for the active settings
    this._settings = {};
    // We often want sorted setting names. Cache
    this._settingNames = [];

    if (persister) {
        this.setPersister(persister);
    }
};

Settings.prototype = {
    /**
     * Function to add to the list of available settings.
     * <p>Example usage:
     * <pre>
     * var settings = plugins.catalog.getObject('settings');
     * settings.addSetting({
     *     name: 'tabsize', // For use in settings.get('X')
     *     type: 'number',  // To allow value checking.
     *     defaultValue: 4  // Default value for use when none is directly set
     * });
     * </pre>
     * @param {object} settingSpec Object containing name/type/defaultValue members.
     */
    addSetting: function(settingSpec) {
        var setting = new Setting(settingSpec, this);
        this._settings[setting.name] = setting;
        this._settingNames.push(setting.name);
        this._settingNames.sort();
    },

    removeSetting: function(setting) {
        var name = (typeof setting === 'string' ? setting : setting.name);
        delete this._settings[name];
        util.arrayRemove(this._settingNames, name);
    },

    getSettingNames: function() {
        return this._settingNames;
    },

    getSetting: function(name) {
        return this._settings[name];
    },

    /**
     * A Persister is able to store settings. It is an object that defines
     * two functions:
     * loadInitialValues(settings) and persistValue(settings, key, value).
     */
    setPersister: function(persister) {
        this._persister = persister;
        if (persister) {
            persister.loadInitialValues(this);
        }
    },

    resetAll: function() {
        this.getSettingNames().forEach(function(key) {
            this.resetValue(key);
        }, this);
    },

    /**
     * Retrieve a list of the known settings and their values
     */
    _list: function() {
        var reply = [];
        this.getSettingNames().forEach(function(setting) {
            reply.push({
                'key': setting,
                'value': this.getSetting(setting).get()
            });
        }, this);
        return reply;
    },

    /**
     * Prime the local cache with the defaults.
     */
    _loadDefaultValues: function() {
        this._loadFromObject(this._getDefaultValues());
    },

    /**
     * Utility to load settings from an object
     */
    _loadFromObject: function(data) {
        // We iterate over data rather than keys so we don't forget values
        // which don't have a setting yet.
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var setting = this._settings[key];
                if (setting) {
                    var value = setting.type.parse(data[key]);
                    this.set(key, value);
                } else {
                    this.set(key, data[key]);
                }
            }
        }
    },

    /**
     * Utility to grab all the settings and export them into an object
     */
    _saveToObject: function() {
        return this.getSettingNames().map(function(key) {
            return this._settings[key].type.stringify(this.get(key));
        }.bind(this));
    },

    /**
     * The default initial settings
     */
    _getDefaultValues: function() {
        return this.getSettingNames().map(function(key) {
            return this._settings[key].spec.defaultValue;
        }.bind(this));
    }
};
exports.settings = new Settings();

/**
 * Save the settings in a cookie
 * This code has not been tested since reboot
 * @constructor
 */
function CookiePersister() {
};

CookiePersister.prototype = {
    loadInitialValues: function(settings) {
        settings._loadDefaultValues();
        var data = cookie.get('settings');
        settings._loadFromObject(JSON.parse(data));
    },

    persistValue: function(settings, key, value) {
        try {
            var stringData = JSON.stringify(settings._saveToObject());
            cookie.set('settings', stringData);
        } catch (ex) {
            console.error('Unable to JSONify the settings! ' + ex);
            return;
        }
    }
};

exports.CookiePersister = CookiePersister;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/useragent', function(require, exports, module) {

var os = (navigator.platform.match(/mac|win|linux/i) || ["other"])[0].toLowerCase();
var ua = navigator.userAgent;
var av = navigator.appVersion;

/** Is the user using a browser that identifies itself as Windows */
exports.isWin = (os == "win");

/** Is the user using a browser that identifies itself as Mac OS */
exports.isMac = (os == "mac");

/** Is the user using a browser that identifies itself as Linux */
exports.isLinux = (os == "linux");

exports.isIE = ! + "\v1";

/** Is this Firefox or related? */
exports.isGecko = exports.isMozilla = window.controllers && window.navigator.product === "Gecko";

/** oldGecko == rev < 2.0 **/
exports.isOldGecko = exports.isGecko && /rv\:1/.test(navigator.userAgent);

/** Is this Opera */
exports.isOpera = window.opera && Object.prototype.toString.call(window.opera) == "[object Opera]";

/** Is the user using a browser that identifies itself as WebKit */
exports.isWebKit = parseFloat(ua.split("WebKit/")[1]) || undefined;

exports.isAIR = ua.indexOf("AdobeAIR") >= 0;

/**
 * I hate doing this, but we need some way to determine if the user is on a Mac
 * The reason is that users have different expectations of their key combinations.
 *
 * Take copy as an example, Mac people expect to use CMD or APPLE + C
 * Windows folks expect to use CTRL + C
 */
exports.OS = {
    LINUX: 'LINUX',
    MAC: 'MAC',
    WINDOWS: 'WINDOWS'
};

/**
 * Return an exports.OS constant
 */
exports.getOS = function() {
    if (exports.isMac) {
        return exports.OS['MAC'];
    } else if (exports.isLinux) {
        return exports.OS['LINUX'];
    } else {
        return exports.OS['WINDOWS'];
    }
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Joe Walker (jwalker@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/typecheck', function(require, exports, module) {

var objectToString = Object.prototype.toString;

/**
 * Return true if it is a String
 */
exports.isString = function(it) {
    return it && objectToString.call(it) === "[object String]";
};

/**
 * Returns true if it is a Boolean.
 */
exports.isBoolean = function(it) {
    return it && objectToString.call(it) === "[object Boolean]";
};

/**
 * Returns true if it is a Number.
 */
exports.isNumber = function(it) {
    return it && objectToString.call(it) === "[object Number]" && isFinite(it);
};

/**
 * Hack copied from dojo.
 */
exports.isObject = function(it) {
    return it !== undefined &&
        (it === null || typeof it == "object" ||
        Array.isArray(it) || exports.isFunction(it));
};

/**
 * Is the passed object a function?
 * From dojo.isFunction()
 */
exports.isFunction = function(it) {
    return it && objectToString.call(it) === "[object Function]";
};

});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/plugin_manager', function(require, exports, module) {

var Promise = require("pilot/promise").Promise;

exports.REASONS = {
    APP_STARTUP: 1,
    APP_SHUTDOWN: 2,
    PLUGIN_ENABLE: 3,
    PLUGIN_DISABLE: 4,
    PLUGIN_INSTALL: 5,
    PLUGIN_UNINSTALL: 6,
    PLUGIN_UPGRADE: 7,
    PLUGIN_DOWNGRADE: 8
};

exports.Plugin = function(name) {
    this.name = name;
    this.status = this.INSTALLED;
};

exports.Plugin.prototype = {
    /**
     * constants for the state
     */
    NEW: 0,
    INSTALLED: 1,
    REGISTERED: 2,
    STARTED: 3,
    UNREGISTERED: 4,
    SHUTDOWN: 5,

    install: function(data, reason) {
        var pr = new Promise();
        if (this.status > this.NEW) {
            pr.resolve(this);
            return pr;
        }
        require([this.name], function(pluginModule) {
            if (pluginModule.install) {
                pluginModule.install(data, reason);
            }
            this.status = this.INSTALLED;
            pr.resolve(this);
        }.bind(this));
        return pr;
    },

    register: function(data, reason) {
        var pr = new Promise();
        if (this.status != this.INSTALLED) {
            pr.resolve(this);
            return pr;
        }
        require([this.name], function(pluginModule) {
            if (pluginModule.register) {
                pluginModule.register(data, reason);
            }
            this.status = this.REGISTERED;
            pr.resolve(this);
        }.bind(this));
        return pr;
    },

    startup: function(data, reason) {
        reason = reason || exports.REASONS.APP_STARTUP;
        var pr = new Promise();
        if (this.status != this.REGISTERED) {
            pr.resolve(this);
            return pr;
        }
        require([this.name], function(pluginModule) {
            if (pluginModule.startup) {
                pluginModule.startup(data, reason);
            }
            this.status = this.STARTED;
            pr.resolve(this);
        }.bind(this));
        return pr;
    },

    shutdown: function(data, reason) {
        if (this.status != this.STARTED) {
            return;
        }
        pluginModule = require(this.name);
        if (pluginModule.shutdown) {
            pluginModule.shutdown(data, reason);
        }
    }
};

exports.PluginCatalog = function() {
    this.plugins = {};
};

exports.PluginCatalog.prototype = {
    registerPlugins: function(pluginList, data, reason) {
        var registrationPromises = [];
        pluginList.forEach(function(pluginName) {
            var plugin = this.plugins[pluginName];
            if (plugin === undefined) {
                plugin = new exports.Plugin(pluginName);
                this.plugins[pluginName] = plugin;
                registrationPromises.push(plugin.register(data, reason));
            }
        }.bind(this));
        return Promise.group(registrationPromises);
    },

    startupPlugins: function(data, reason) {
        var startupPromises = [];
        for (var pluginName in this.plugins) {
            var plugin = this.plugins[pluginName];
            startupPromises.push(plugin.startup(data, reason));
        }
        return Promise.group(startupPromises);
    }
};

exports.catalog = new exports.PluginCatalog();

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('pilot/fixoldbrowsers', function(require, exports, module) {

/**
 * Array detector.
 * Firefox 3.5 and Safari 4 have this already. Chrome 4 however ...
 * Note to Dojo - your isArray is still broken: instanceof doesn't work with
 * Arrays taken from a different frame/window.
 */
if (!Array.isArray) {
    Array.isArray = function(data) {
        return data && Object.prototype.toString.call(data) === "[object Array]";
    };
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(searchElement /*, fromIndex */)
	{
		if (this === void 0 || this === null)
	    	throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0)
		    return -1;
		
		var n = 0;
		if (arguments.length > 0) {
		    n = Number(arguments[1]);
		    if (n !== n)
		        n = 0;
		    else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
		        n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
		
		if (n >= len)
		    return -1;
		
		var k = n >= 0
		    ? n
		    : Math.max(len - Math.abs(n), 0);
		
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement)
			    return k;
		}
		return -1;
	};
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp */) {
		if (this === void 0 || this === null)
		    throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun !== "function")
		    throw new TypeError();
		
    	res = new Array(len);
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in t)
			    res[i] = fun.call(thisp, t[i], i, t);
		}
    	
    	return res;
	};
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun /*, thisp */) {
		if (this === void 0 || this === null)
		    throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (typeof fun !== "function")
		    throw new TypeError();
		
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in t)
			    fun.call(thisp, t[i], i, t);
		}
	};
}

/**
 * Retrieves the list of keys on an object.
 */
if (!Object.keys) {
    Object.keys = function(obj) {
        var k, ret = [];
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                ret.push(k);
            }
        }
        return ret;
    };
}

if (!Function.prototype.bind) {    
    // from MDC
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
    Function.prototype.bind = function (obj) {       
        var slice = [].slice;
        var args = slice.call(arguments, 1);
        var self = this;
        var nop = function () {};

        // optimize common case
        if (arguments.length == 1) {
	        var bound = function() {
	            return self.apply(this instanceof nop ? this : obj, arguments);
	        };
        }
        else {
	        var bound = function () {
	            return self.apply(
	                this instanceof nop ? this : ( obj || {} ), 
	                args.concat( slice.call(arguments) )
	            );
	        };
        }
	    
        nop.prototype = self.prototype;    
        bound.prototype = new nop();    
        
        // From Narwhal
        bound.name = this.name;
        bound.displayName = this.displayName;
        bound.length = this.length;
        bound.unbound = self;
        
        return bound;
    };
}


if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+/, "").replace(/\s+$/, "");
    }
}

exports.globalsLoaded = true;

});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Fabian Jakobs <fabian AT ajax DOT org>
 *   Julian Viereck (julian.viereck@gmail.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/hash_handler', function(require, exports, module) {

var keyUtil  = require("pilot/keys");

function HashHandler(config) {
    this.setConfig(config);
}

(function() {
    function splitSafe(s, separator, limit, bLowerCase) {
        return (bLowerCase && s.toLowerCase() || s)
            .replace(/(?:^\s+|\n|\s+$)/g, "")
            .split(new RegExp("[\\s ]*" + separator + "[\\s ]*", "g"), limit || 999);
    }

    function parseKeys(keys, val, ret) {
        var key,
            hashId = 0,
            parts  = splitSafe(keys, "\\-", null, true),
            i      = 0,
            l      = parts.length;

        for (; i < l; ++i) {
            if (keyUtil.KEY_MODS[parts[i]])
                hashId = hashId | keyUtil.KEY_MODS[parts[i]];
            else
                key = parts[i] || "-"; //when empty, the splitSafe removed a '-'
        }

        (ret[hashId] || (ret[hashId] = {}))[key] = val;
        return ret;
    }

    function objectReverse(obj, keySplit) {
        var i, j, l, key,
            ret = {};
        for (i in obj) {
            key = obj[i];
            if (keySplit && typeof key == "string") {
                key = key.split(keySplit);
                for (j = 0, l = key.length; j < l; ++j)
                    parseKeys.call(this, key[j], i, ret);
            }
            else {
                parseKeys.call(this, key, i, ret);
            }
        }
        return ret;
    }

    this.setConfig = function(config) {
        this.$config = config;
        if (typeof this.$config.reverse == "undefined")
            this.$config.reverse = objectReverse.call(this, this.$config, "|");
    };

    /**
     * This function is called by keyBinding.
     */
    this.handleKeyboard = function(data, hashId, textOrKey, keyCode) {
        // Figure out if a commandKey was pressed or just some text was insert.
        if (hashId != 0 || keyCode != 0) {
            return {
                command: (this.$config.reverse[hashId] || {})[textOrKey]
            }
        } else {
            return {
                command: "inserttext",
                args: {
                    text: textOrKey
                }
            }
        }
    }
}).call(HashHandler.prototype)

exports.HashHandler = HashHandler;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Julian Viereck (julian.viereck@gmail.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/state_handler', function(require, exports, module) {

// If you're developing a new keymapping and want to get an idea what's going
// on, then enable debugging.
var DEBUG = false;

function StateHandler(keymapping) {
    this.keymapping = this.$buildKeymappingRegex(keymapping);
}

StateHandler.prototype = {
    /**
     * Build the RegExp from the keymapping as RegExp can't stored directly
     * in the metadata JSON and as the RegExp used to match the keys/buffer
     * need to be adapted.
     */
    $buildKeymappingRegex: function(keymapping) {
        for (state in keymapping) {
            this.$buildBindingsRegex(keymapping[state]);
        }
        return keymapping;
    },

    $buildBindingsRegex: function(bindings) {
        // Escape a given Regex string.
        bindings.forEach(function(binding) {
            if (binding.key) {
                binding.key = new RegExp('^' + binding.key + '$');
            } else if (Array.isArray(binding.regex)) {
                binding.key = new RegExp('^' + binding.regex[1] + '$');
                binding.regex = new RegExp(binding.regex.join('') + '$');
            } else if (binding.regex) {
                binding.regex = new RegExp(binding.regex + '$');
            }
        });
    },

    $composeBuffer: function(data, hashId, key) {
        // Initialize the data object.
        if (data.state == null || data.buffer == null) {
            data.state = "start";
            data.buffer = "";
        }

        var keyArray = [];
        if (hashId & 1) keyArray.push("Ctrl");
        if (hashId & 8) keyArray.push("Command");
        if (hashId & 2) keyArray.push("Option");
        if (hashId & 4) keyArray.push("Shift");
        if (key)        keyArray.push(key);

        var symbolicName = keyArray.join("-").toLowerCase();
        var bufferToUse = data.buffer + symbolicName;

        // Don't add the symbolic name to the key buffer if the alt_ key is
        // part of the symbolic name. If it starts with alt_, this means
        // that the user hit an alt keycombo and there will be a single,
        // new character detected after this event, which then will be
        // added to the buffer (e.g. alt_j will result in ∆).
        //
        // We test for 2 and not for & 2 as we only want to exclude the case where
        // the option key is pressed alone.
        if (hashId != 2) {
            data.buffer = bufferToUse;
        }

        return {
            bufferToUse:    bufferToUse,
            symbolicName:   symbolicName
        };
    },

    $find: function(data, buffer, symbolicName, hashId, key) {
        // Holds the command to execute and the args if a command matched.
        var result = {};

        // Loop over all the bindings of the keymapp until a match is found.
        this.keymapping[data.state].some(function(binding) {
            var match;

            // Check if the key matches.
            if (binding.key && !binding.key.test(symbolicName)) {
                return false;
            }

            // Check if the regex matches.
            if (binding.regex && !(match = binding.regex.exec(buffer))) {
                return false;
            }

            // Check if the match function matches.
            if (binding.match && !binding.match(buffer, hashId, key, symbolicName)) {
                return false;
            }

            // Check for disallowed matches.
            if (binding.disallowMatches) {
                for (var i = 0; i < binding.disallowMatches.length; i++) {
                    if (!!match[binding.disallowMatches[i]]) {
                        return false;
                    }
                }
            }

            // If there is a command to execute, then figure out the
            // comand and the arguments.
            if (binding.exec) {
                result.command = binding.exec;

                // Bulid the arguments.
                if (binding.params) {
                    var value;
                    result.args = {};
                    binding.params.forEach(function(param) {
                        if (param.match != null && match != null) {
                            value = match[param.match] || param.defaultValue;
                        } else {
                            value = param.defaultValue;
                        }

                        if (param.type === 'number') {
                            value = parseInt(value);
                        }

                        result.args[param.name] = value;
                    });
                }
                data.buffer = "";
            }

            // Handle the 'then' property.
            if (binding.then) {
                data.state = binding.then;
                data.buffer = "";
            }

            // If no command is set, then execute the "null" fake command.
            if (result.command == null) {
                result.command = "null";
            }

            if (DEBUG) {
                console.log("KeyboardStateMapper#find", binding);
            }
            return true;
        });

        if (result.command) {
            return result;
        } else {
            data.buffer = "";
            return false;
        }
    },

    /**
     * This function is called by keyBinding.
     */
    handleKeyboard: function(data, hashId, key) {
        // Compute the current value of the keyboard input buffer.
        var r = this.$composeBuffer(data, hashId, key);
        var buffer = r.bufferToUse;
        var symbolicName = r.symbolicName;

        r = this.$find(data, buffer, symbolicName, hashId, key);
        if (DEBUG) {
            console.log("KeyboardStateMapper#match", buffer, symbolicName, r);
        }

        return r;
    }
}

/**
 * This is a useful matching function and therefore is defined here so that
 * users of KeyboardStateMapper can use it.
 *
 * @return boolean
 *          If no command key (Command|Option|Shift|Ctrl) is pressed, it
 *          returns true. If the only the Shift key is pressed + a character
 *          true is returned as well. Otherwise, false is returned.
 *          Summing up, the function returns true whenever the user typed
 *          a normal character on the keyboard and no shortcut.
 */
exports.matchCharacterOnly = function(buffer, hashId, key, symbolicName) {
    // If no command keys are pressed, then catch the input.
    if (hashId == 0) {
        return true;
    }
    // If only the shift key is pressed and a character key, then
    // catch that input as well.
    else if ((hashId == 4) && key.length == 1) {
        return true;
    }
    // Otherwise, we let the input got through.
    else {
        return false;
    }
};

exports.StateHandler = StateHandler;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/keybinding', function(require, exports, module) {

var useragent = require("pilot/useragent");
var keyUtil  = require("pilot/keys");
var event = require("pilot/event");
var settings  = require("pilot/settings").settings;
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
var default_mac = require("ace/keyboard/keybinding/default_mac").bindings;
var default_win = require("ace/keyboard/keybinding/default_win").bindings;
var canon = require("pilot/canon");
require("ace/commands/default_commands");

var KeyBinding = function(editor, config) {
    this.$editor = editor;
    this.$data = { };
    this.$keyboardHandler = null;
    this.$defaulKeyboardHandler = new HashHandler(config || (useragent.isMac
        ? default_mac
        : default_win));
};

(function() {
    this.setKeyboardHandler = function(keyboardHandler) {
        if (this.$keyboardHandler != keyboardHandler) {
            this.$data = { };
            this.$keyboardHandler = keyboardHandler;
        }
    };

    this.getKeyboardHandler = function() {
        return this.$keyboardHandler;
    };

    this.$callKeyboardHandler = function (e, hashId, keyOrText, keyCode) {
        var toExecute;
        if (this.$keyboardHandler) {
            toExecute =
                this.$keyboardHandler.handleKeyboard(this.$data, hashId, keyOrText, keyCode, e);
        }

        // If there is nothing to execute yet, then use the default keymapping.
        if (!toExecute || !toExecute.command) {
            toExecute = this.$defaulKeyboardHandler.
                handleKeyboard(this.$data, hashId, keyOrText, keyCode, e);
        }

        if (toExecute) {
            var success = canon.exec(toExecute.command,
                                        {editor: this.$editor}, toExecute.args);
            if (success) {
                return event.stopEvent(e);
            }
        }
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        key = (keyUtil[keyCode] ||
                String.fromCharCode(keyCode)).toLowerCase();

        this.$callKeyboardHandler(e, hashId, key, keyCode);
    };

    this.onTextInput = function(text) {
        this.$callKeyboardHandler({}, 0, text, 0);
    }

}).call(KeyBinding.prototype);

exports.KeyBinding = KeyBinding;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/textinput', function(require, exports, module) {

var event = require("pilot/event");

var TextInput = function(parentNode, host) {

    var text = document.createElement("textarea");
    var style = text.style;
    style.position = "absolute";
    style.left = "-10000px";
    style.top = "-10000px";
    parentNode.appendChild(text);

    var PLACEHOLDER = String.fromCharCode(0);
    sendText();

    var inCompostion = false;
    var copied = false;

    function sendText(valueToSend) {
        if (!copied) {
            var value = valueToSend || text.value;
            if (value) {
                if (value.charCodeAt(value.length-1) == PLACEHOLDER.charCodeAt(0)) {
                    value = value.slice(0, -1);
                    if (value)
                        host.onTextInput(value);
                } else
                    host.onTextInput(value);
            }
        }
        copied = false;

        // Safari doesn't fire copy events if no text is selected
        text.value = PLACEHOLDER;
        text.select();
    }

    var onTextInput = function(e) {
        setTimeout(function() {
            if (!inCompostion)
                sendText();
        }, 0);
    };

    var onCompositionStart = function(e) {
        inCompostion = true;
        sendText();
        text.value = "";
        host.onCompositionStart();
        setTimeout(onCompositionUpdate, 0);
    };

    var onCompositionUpdate = function() {
        host.onCompositionUpdate(text.value);
    };

    var onCompositionEnd = function() {
        inCompostion = false;
        host.onCompositionEnd();
        onTextInput();
    };

    var onCopy = function() {
        copied = true;
        text.value = host.getCopyText();
        text.select();
        copied = true;
        setTimeout(sendText, 0);
    };

    var onCut = function() {
        copied = true;
        text.value = host.getCopyText();
        host.onCut();
        text.select();
        setTimeout(sendText, 0);
    };

    event.addCommandKeyListener(text, host.onCommandKey.bind(host));
    event.addListener(text, "keypress", onTextInput);
    event.addListener(text, "textInput", onTextInput);
    event.addListener(text, "paste", function(e) {
        // Some browsers support the event.clipboardData API. Use this to get
        // the pasted content which increases speed if pasting a lot of lines.
        if (e.clipboardData && e.clipboardData.getData) {
            sendText(e.clipboardData.getData("text/plain"));
            e.preventDefault();
        } else
        // If a browser doesn't support any of the things above, use the regular
        // method to detect the pasted input.
        {
            onTextInput();
        }
    });
    event.addListener(text, "propertychange", onTextInput);

    event.addListener(text, "copy", onCopy);
    event.addListener(text, "cut", onCut);

    event.addListener(text, "compositionstart", onCompositionStart);
    event.addListener(text, "compositionupdate", onCompositionUpdate);
    event.addListener(text, "compositionend", onCompositionEnd);

    event.addListener(text, "blur", function() {
        host.onBlur();
    });

    event.addListener(text, "focus", function() {
        host.onFocus();
        text.select();
    });

    this.focus = function() {
        host.onFocus();
        text.select();
        text.focus();
    };

    this.blur = function() {
        text.blur();
    };
};

exports.TextInput = TextInput;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Julian Viereck (julian.viereck@gmail.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/keybinding/vim', function(require, exports, module) {

var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var matchCharacterOnly =  require("ace/keyboard/state_handler").matchCharacterOnly;

var vimStates = {
    start: [
        {
            key:    "i",
            then:   "insertMode"
        },
        {
            regex:  [ "([0-9]*)", "(k|up)" ],
            exec:   "golineup",
            params: [
                {
                    name:     "times",
                    match:    1,
                    type:     "number",
                    defaultValue:     1
                }
            ]
        },
        {
            regex:  [ "([0-9]*)", "(j|down|enter)" ],
            exec:   "golinedown",
            params: [
                {
                    name:    "times",
                    match:   1,
                    type:    "number",
                    defaultValue:    1
                }
            ]
        },
        {
            regex:  [ "([0-9]*)", "(l|right)" ],
            exec:   "gotoright",
            params: [
                {
                    name:   "times",
                    match:  1,
                    type:   "number",
                    defaultValue:     1
                }
            ]
        },
        {
            regex:  [ "([0-9]*)", "(h|left)" ],
            exec:   "gotoleft",
            params: [
                {
                    name:     "times",
                    match:    1,
                    type:     "number",
                    defaultValue:     1
                }
            ]
        },
        {
            comment:    "Catch some keyboard input to stop it here",
            match:      matchCharacterOnly
        }
    ],
    insertMode: [
        {
            key:      "esc",
            then:     "start"
        }
    ]
};

exports.Vim = new StateHandler(vimStates);

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Julian Viereck (julian.viereck@gmail.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/keybinding/emacs', function(require, exports, module) {

var StateHandler = require("ace/keyboard/state_handler").StateHandler;
var matchCharacterOnly =  require("ace/keyboard/state_handler").matchCharacterOnly;

var emacsState = {
    start: [
        {
            key:    "ctrl-x",
            then:   "c-x"
        },
        {
            regex:  [ "(?:command-([0-9]*))*", "(down|ctrl-n)" ],
            exec:   "golinedown",
            params: [
                {
                    name: "times",
                    match: 1,
                    type: "number",
                    defaultValue: 1
                }
            ]
        },
        {
            regex: [ "(?:command-([0-9]*))*", "(right|ctrl-f)" ],
            exec: "gotoright",
            params: [
                {
                    name: "times",
                    match: 1,
                    type: "number",
                    defaultValue: 1
                }
            ]
        },
        {
            regex: [ "(?:command-([0-9]*))*", "(up|ctrl-p)" ],
            exec: "golineup",
            params: [
                {
                    name: "times",
                    match: 1,
                    type: "number",
                    defaultValue: 1
                }
            ]
        },
        {
            regex: [ "(?:command-([0-9]*))*", "(left|ctrl-b)" ],
            exec: "gotoleft",
            params: [
                {
                    name: "times",
                    match: 1,
                    type: "number",
                    defaultValue: 1
                }
            ]
        },
        {
            comment: "This binding matches all printable characters except numbers as long as they are no numbers and print them n times.",
            regex:  [ "(?:command-([0-9]*))", "([^0-9]+)*" ],
            match:  matchCharacterOnly,
            exec:   "inserttext",
            params: [
                {
                    name: "times",
                    match: 1,
                    type: "number",
                    defaultValue: "1"
                },
                {
                    name: "text",
                    match: 2
                }
            ]
        },
        {
            comment: "This binding matches numbers as long as there is no meta_number in the buffer.",
            regex:  [ "(command-[0-9]*)*", "([0-9]+)" ],
            match:  matchCharacterOnly,
            disallowMatches:  [ 1 ],
            exec:   "inserttext",
            params: [
                {
                    name: "text",
                    match: 2,
                    type: "text"
                }
            ]
        },
        {
            regex: [ "command-([0-9]*)", "(command-[0-9]|[0-9])" ],
            comment: "Stops execution if the regex /meta_[0-9]+/ matches to avoid resetting the buffer."
        }
    ],
    "c-x": [
        {
            key: "ctrl-g",
            then: "start"
        },
        {
            key: "ctrl-s",
            exec: "save",
            then: "start"
        }
    ]
};

exports.Emacs = new StateHandler(emacsState);

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/keybinding/default_mac', function(require, exports, module) {

exports.bindings = {
    "selectall": "Command-A",
    "removeline": "Command-D",
    "gotoline": "Command-L",
    "togglecomment": "Command-7",
    "findnext": "Command-K",
    "findprevious": "Command-Shift-K",
    "find": "Command-F",
    "replace": "Command-R",
    "undo": "Command-Z",
    "redo": "Command-Shift-Z|Command-Y",
    "overwrite": "Insert",
    "copylinesup": "Command-Option-Up",
    "movelinesup": "Option-Up",
    "selecttostart": "Command-Shift-Up",
    "gotostart": "Command-Home|Command-Up",
    "selectup": "Shift-Up",
    "golineup": "Up",
    "copylinesdown": "Command-Option-Down",
    "movelinesdown": "Option-Down",
    "selecttoend": "Command-Shift-Down",
    "gotoend": "Command-End|Command-Down",
    "selectdown": "Shift-Down",
    "golinedown": "Down",
    "selectwordleft": "Option-Shift-Left",
    "gotowordleft": "Option-Left",
    "selecttolinestart": "Command-Shift-Left",
    "gotolinestart": "Command-Left|Home",
    "selectleft": "Shift-Left",
    "gotoleft": "Left",
    "selectwordright": "Option-Shift-Right",
    "gotowordright": "Option-Right",
    "selecttolineend": "Command-Shift-Right",
    "gotolineend": "Command-Right|End",
    "selectright": "Shift-Right",
    "gotoright": "Right",
    "selectpagedown": "Shift-PageDown",
    "pagedown": "PageDown",
    "selectpageup": "Shift-PageUp",
    "pageup": "PageUp",
    "selectlinestart": "Shift-Home",
    "selectlineend": "Shift-End",
    "del": "Delete",
    "backspace": "Ctrl-Backspace|Command-Backspace|Option-Backspace|Backspace",
    "outdent": "Shift-Tab",
    "indent": "Tab"
};

});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/keybinding/default_win', function(require, exports, module) {

exports.bindings = {
    "selectall": "Ctrl-A",
    "removeline": "Ctrl-D",
    "gotoline": "Ctrl-L",
    "togglecomment": "Ctrl-7",
    "findnext": "Ctrl-K",
    "findprevious": "Ctrl-Shift-K",
    "find": "Ctrl-F",
    "replace": "Ctrl-R",
    "undo": "Ctrl-Z",
    "redo": "Ctrl-Shift-Z|Ctrl-Y",
    "overwrite": "Insert",
    "copylinesup": "Ctrl-Alt-Up",
    "movelinesup": "Alt-Up",
    "selecttostart": "Alt-Shift-Up",
    "gotostart": "Ctrl-Home|Ctrl-Up",
    "selectup": "Shift-Up",
    "golineup": "Up",
    "copylinesdown": "Ctrl-Alt-Down",
    "movelinesdown": "Alt-Down",
    "selecttoend": "Alt-Shift-Down",
    "gotoend": "Ctrl-End|Ctrl-Down",
    "selectdown": "Shift-Down",
    "golinedown": "Down",
    "selectwordleft": "Ctrl-Shift-Left",
    "gotowordleft": "Ctrl-Left",
    "selecttolinestart": "Alt-Shift-Left",
    "gotolinestart": "Alt-Left|Home",
    "selectleft": "Shift-Left",
    "gotoleft": "Left",
    "selectwordright": "Ctrl-Shift-Right",
    "gotowordright": "Ctrl-Right",
    "selecttolineend": "Alt-Shift-Right",
    "gotolineend": "Alt-Right|End",
    "selectright": "Shift-Right",
    "gotoright": "Right",
    "selectpagedown": "Shift-PageDown",
    "pagedown": "PageDown",
    "selectpageup": "Shift-PageUp",
    "pageup": "PageUp",
    "selectlinestart": "Shift-Home",
    "selectlineend": "Shift-End",
    "del": "Delete",
    "backspace": "Backspace",
    "outdent": "Shift-Tab",
    "indent": "Tab"
};

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/edit_session', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var Selection = require("ace/selection").Selection;
var TextMode = require("ace/mode/text").Mode;
var Range = require("ace/range").Range;
var Document = require("ace/document").Document;

var NO_CHANGE_DELTAS = {};

var EditSession = function(text, mode) {
    this.$modified = true;
    this.selection = new Selection(this);
    this.$breakpoints = [];

    this.listeners = [];
    if (mode) {
        this.setMode(mode);
    }
    
    if (text instanceof Document) {
        this.setDocument(text)
    } else {
        this.setDocument(new Document(text));
    }
};


(function() {

    oop.implement(this, EventEmitter);

    this.setDocument = function(doc) {
        if (this.doc)
            throw new Error("Document is already set");
            
        this.doc = doc;
        doc.on("change", this.onChange.bind(this));
    };
    
    this.getDocument = function() {
        return this.doc;
    };
    
    this.onChange = function(e) {
        var delta = e.data;
        this.$modified = true;
        if (!this.$fromUndo && this.$undoManager) {
            this.$deltas.push(delta);
            this.$informUndoManager.schedule();
        }
        this._dispatchEvent("change", e);
    };

    this.setValue = function(text) {
      this.doc.setValue(text);
      this.$deltas = [];
    };

    this.getValue =
    this.toString = function() {
        return this.doc.getValue();
    };
    
    this.getSelection = function() {
        return this.selection;
    };

    this.setUndoManager = function(undoManager) {
        this.$undoManager = undoManager;
        this.$deltas = [];

        if (this.$informUndoManager) {
            this.$informUndoManager.cancel();
        }

        if (undoManager) {
            var self = this;
            this.$informUndoManager = lang.deferredCall(function() {
                if (self.$deltas.length > 0)
                    undoManager.execute({
                        action : "aceupdate",
                        args   : [self.$deltas, self]
                    });
                self.$deltas = [];
            });
        }
    };

    this.$defaultUndoManager = {
        undo: function() {},
        redo: function() {}
    };

    this.getUndoManager = function() {
        return this.$undoManager || this.$defaultUndoManager;
    },

    this.getTabString = function() {
        if (this.getUseSoftTabs()) {
            return lang.stringRepeat(" ", this.getTabSize());
        } else {
            return "\t";
        }
    };

    this.$useSoftTabs = true;
    this.setUseSoftTabs = function(useSoftTabs) {
        if (this.$useSoftTabs === useSoftTabs) return;

        this.$useSoftTabs = useSoftTabs;
    };

    this.getUseSoftTabs = function() {
        return this.$useSoftTabs;
    };

    this.$tabSize = 4;
    this.setTabSize = function(tabSize) {
        if (isNaN(tabSize) || this.$tabSize === tabSize) return;

        this.$modified = true;
        this.$tabSize = tabSize;
        this._dispatchEvent("changeTabSize");
    };

    this.getTabSize = function() {
        return this.$tabSize;
    };
    
    this.isTabStop = function(position) {
        return this.$useSoftTabs && (position.column % this.$tabSize == 0);
    };

    this.getBreakpoints = function() {
        return this.$breakpoints;
    };

    this.setBreakpoints = function(rows) {
        this.$breakpoints = [];
        for (var i=0; i<rows.length; i++) {
            this.$breakpoints[rows[i]] = true;
        }
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.clearBreakpoints = function() {
        this.$breakpoints = [];
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.setBreakpoint = function(row) {
        this.$breakpoints[row] = true;
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.clearBreakpoint = function(row) {
        delete this.$breakpoints[row];
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r?\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };
    
    this.tokenRe = /^[\w\d]+/g;
    this.nonTokenRe = /^[^\w\d]+/g;
    
    this.getWordRange = function(row, column) {
        var line = this.getLine(row);
        
        var inToken = false;
        if (column > 0) {
            inToken = !!line.charAt(column - 1).match(this.tokenRe);
        }

        if (!inToken) {
            inToken = !!line.charAt(column).match(this.tokenRe);
        }

        var re = inToken ? this.tokenRe : this.nonTokenRe;

        var start = column;
        if (start > 0) {
            do {
                start--;
            }
            while (start >= 0 && line.charAt(start).match(re));
            start++;
        }

        var end = column;
        while (end < line.length && line.charAt(end).match(re)) {
            end++;
        }

        return new Range(row, start, row, end);
    };

    this.setNewLineMode = function(newLineMode) {
        this.doc.setNewLineMode(newLineMode);
    };

    this.getNewLineMode = function() {
        return this.doc.getNewLineMode();
    };

    this.$mode = null;
    this.setMode = function(mode) {
        if (this.$mode === mode) return;

        this.$mode = mode;
        this._dispatchEvent("changeMode");
    };

    this.getMode = function() {
        if (!this.$mode) {
            this.$mode = new TextMode();
        }
        return this.$mode;
    };

    this.$scrollTop = 0;
    this.setScrollTopRow = function(scrollTopRow) {
        if (this.$scrollTop === scrollTopRow) return;

        this.$scrollTop = scrollTopRow;
        this._dispatchEvent("changeScrollTop");
    };

    this.getScrollTopRow = function() {
        return this.$scrollTop;
    };

    this.getWidth = function() {
        this.$computeWidth();
        return this.width;
    };

    this.getScreenWidth = function() {
        this.$computeWidth();
        return this.screenWidth;
    };

    this.$computeWidth = function() {
        if (this.$modified) {
            this.$modified = false;

            var lines = this.doc.getAllLines();
            var longestLine = 0;
            var longestScreenLine = 0;
            var tabSize = this.getTabSize();

            for ( var i = 0; i < lines.length; i++) {
                var len = lines[i].length;
                longestLine = Math.max(longestLine, len);

                lines[i].replace(/\t/g, function(m) {
                    len += tabSize-1;
                    return m;
                });
                longestScreenLine = Math.max(longestScreenLine, len);
            }
            this.width = longestLine;
            this.screenWidth = longestScreenLine;
        }
    };

    /**
     * Get a verbatim copy of the given line as it is in the document 
     */
    this.getLine = function(row) {
        return this.doc.getLine(row);
    };
    
    /**
     * Get a line as it is displayed on screen. Tabs are replaced by spaces.
     */
    this.getDisplayLine = function(row) {
        var tab = new Array(this.getTabSize()+1).join(" ");
        return this.doc.getLine(row).replace(/\t/g, tab);
    };

    this.getLines = function(firstRow, lastRow) {
        return this.doc.getLines(firstRow, lastRow);
    };

    this.getLength = function() {
        return this.doc.getLength();
    };

    this.getTextRange = function(range) {
        return this.doc.getTextRange(range);
    };

    this.findMatchingBracket = function(position) {
        if (position.column == 0) return null;

        var charBeforeCursor = this.getLine(position.row).charAt(position.column-1);
        if (charBeforeCursor == "") return null;

        var match = charBeforeCursor.match(/([\(\[\{])|([\)\]\}])/);
        if (!match) {
            return null;
        }

        if (match[1]) {
            return this.$findClosingBracket(match[1], position);
        } else {
            return this.$findOpeningBracket(match[2], position);
        }
    };

    this.$brackets = {
        ")": "(",
        "(": ")",
        "]": "[",
        "[": "]",
        "{": "}",
        "}": "{"
    };

    this.$findOpeningBracket = function(bracket, position) {
        var openBracket = this.$brackets[bracket];

        var column = position.column - 2;
        var row = position.row;
        var depth = 1;

        var line = this.getLine(row);

        while (true) {
            while(column >= 0) {
                var ch = line.charAt(column);
                if (ch == openBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: row, column: column};
                    }
                }
                else if (ch == bracket) {
                    depth +=1;
                }
                column -= 1;
            }
            row -=1;
            if (row < 0) break;

            var line = this.getLine(row);
            var column = line.length-1;
        }
        return null;
    };

    this.$findClosingBracket = function(bracket, position) {
        var closingBracket = this.$brackets[bracket];

        var column = position.column;
        var row = position.row;
        var depth = 1;

        var line = this.getLine(row);
        var lineCount = this.getLength();

        while (true) {
            while(column < line.length) {
                var ch = line.charAt(column);
                if (ch == closingBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: row, column: column};
                    }
                }
                else if (ch == bracket) {
                    depth +=1;
                }
                column += 1;
            }
            row +=1;
            if (row >= lineCount) break;

            var line = this.getLine(row);
            var column = 0;
        }
        return null;
    };

    this.insert = function(position, text) {
        return this.doc.insert(position, text);
    };
    
    /**
     * @param rows Array[Integer] sorted list of rows
     */
    this.multiRowInsert = function(rows, column, text) {        
        for (var i=rows.length-1; i>=0; i--) {
            var row = rows[i];
            if (row >= this.doc.getLength())
                continue;
                
            var diff = column - this.doc.getLine(row).length;
            if ( diff > 0) {
                var padded = lang.stringRepeat(" ", diff) + text;
                var offset = -diff;
            }
            else {
                padded = text;
                offset = 0;
            }
                
            var end = this.insert({row: row, column: column+offset}, padded);
        }
        
        return {
            rows: end ? end.row - rows[0] : 0,
            columns: end ? end.column - column : 0
        }
    };

    this.remove = function(range) {
        return this.doc.remove(range);
    };

    this.multiRowRemove = function(rows, range) {
        if (range.start.row !== rows[0])
            throw new TypeError("range must start in the first row!");
            
        var height = range.end.row - rows[0];
        for (var i=rows.length-1; i>=0; i--) {
            var row = rows[i];
            if (row >= this.doc.getLength())
                continue;
                
            var end = this.remove(new Range(row, range.start.column, row+height, range.end.column));
        }
    };
    
    this.undoChanges = function(deltas) {
        if (!deltas.length)
            return;
            
        this.$fromUndo = true;
        this.doc.revertDeltas(deltas);
        this.$fromUndo = false;
        
        // update the selection
        var firstDelta = deltas[0];
        var lastDelta = deltas[deltas.length-1];
        
        this.selection.clearSelection();
        if (firstDelta.action == "insertText" || firstDelta.action == "insertLines")
            this.selection.moveCursorToPosition(firstDelta.range.start);
        if (firstDelta.action == "removeText" || firstDelta.action == "removeLines")
            this.selection.setSelectionRange(Range.fromPoints(firstDelta.range.start, lastDelta.range.end));
    },

    this.redoChanges = function(deltas) {
        if (!deltas.length)
            return;
            
        this.$fromUndo = true;
        this.doc.applyDeltas(deltas);
        this.$fromUndo = false;
        
        // update the selection
        var firstDelta = deltas[0];
        var lastDelta = deltas[deltas.length-1];
        
        this.selection.clearSelection();
        if (firstDelta.action == "insertText" || firstDelta.action == "insertLines")
            this.selection.setSelectionRange(Range.fromPoints(firstDelta.range.start, lastDelta.range.end));
        if (firstDelta.action == "removeText" || firstDelta.action == "removeLines")
            this.selection.moveCursorToPosition(firstDelta.range.start);
    },

    this.replace = function(range, text) {
        return this.doc.replace(range, text);
    };

    this.indentRows = function(startRow, endRow, indentString) {
        indentString = indentString.replace(/\t/g, this.getTabString());
        for (var row=startRow; row<=endRow; row++) {
            this.insert({row: row, column:0}, indentString);
        }
        return indentString.length;
    };

    this.outdentRows = function (range) {
        var rowRange = range.collapseRows();
        var deleteRange = new Range(0, 0, 0, 0);
        var size = this.getTabSize();
        
        for (var i = rowRange.start.row; i <= rowRange.end.row; ++i) {
            var line = this.getLine(i);
            
            deleteRange.start.row = i;
            deleteRange.end.row = i;
            for (var j = 0; j < size; ++j)
                if (line.charAt(j) != ' ')
                    break;            
            if (j < size && line.charAt(j) == '\t') {
                deleteRange.start.column = j;
                deleteRange.end.column = j + 1;
            } else {
                deleteRange.start.column = 0;
                deleteRange.end.column = j;
            }
            if (i == range.start.row)
                range.start.column -= deleteRange.end.column - deleteRange.start.column;
            if (i == range.end.row)
                range.end.column -= deleteRange.end.column - deleteRange.start.column;
            this.remove(deleteRange);
        }
        return range;
    }    

    this.moveLinesUp = function(firstRow, lastRow) {
        if (firstRow <= 0) return 0;

        var removed = this.doc.removeLines(firstRow, lastRow);
        this.doc.insertLines(firstRow - 1, removed);
        return -1;
    };

    this.moveLinesDown = function(firstRow, lastRow) {
        if (lastRow >= this.doc.getLength()-1) return 0;

        var removed = this.doc.removeLines(firstRow, lastRow);
        this.doc.insertLines(firstRow+1, removed);
        return 1;
    };

    this.duplicateLines = function(firstRow, lastRow) {
        var firstRow = this.$clipRowToDocument(firstRow);
        var lastRow = this.$clipRowToDocument(lastRow);

        var lines = this.getLines(firstRow, lastRow);
        this.doc.insertLines(firstRow, lines);

        var addedRows = lastRow - firstRow + 1;
        return addedRows;
    };

    this.$clipRowToDocument = function(row) {
        return Math.max(0, Math.min(row, this.doc.getLength()-1));
    };

    this.documentToScreenColumn = function(row, docColumn) {
        var tabSize = this.getTabSize();

        var screenColumn = 0;
        var remaining = docColumn;

        var line = this.getLine(row).split("\t");
        for (var i=0; i<line.length; i++) {
            var len = line[i].length;
            if (remaining > len) {
                remaining -= (len + 1);
                screenColumn += len + tabSize;
            }
            else {
                screenColumn += remaining;
                break;
            }
        }

        return screenColumn;
    };

    this.screenToDocumentColumn = function(row, screenColumn) {
        var tabSize = this.getTabSize();

        var docColumn = 0;
        var remaining = screenColumn;

        var line = this.getLine(row).split("\t");
        for (var i=0; i<line.length; i++) {
            var len = line[i].length;
            if (remaining >= len + tabSize) {
                remaining -= (len + tabSize);
                docColumn += (len + 1);
            }
            else if (remaining > len){
                docColumn += len;
                break;
            }
            else {
                docColumn += remaining;
                break;
            }
        }
        return docColumn;
    };

}).call(EditSession.prototype);

exports.EditSession = EditSession;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/tokenizer', function(require, exports, module) {

var Tokenizer = function(rules) {
    this.rules = rules;

    this.regExps = {};
    for ( var key in this.rules) {
        var state = this.rules[key];
        var ruleRegExps = [];

        for ( var i = 0; i < state.length; i++) {
            ruleRegExps.push(state[i].regex);
        };

        this.regExps[key] = new RegExp("(?:(" + ruleRegExps.join(")|(") + ")|(.))", "g");
    }
};

(function() {

    this.getLineTokens = function(line, startState) {
        var currentState = startState;
        var state = this.rules[currentState];
        var re = this.regExps[currentState];
        re.lastIndex = 0;

        var match, tokens = [];

        var lastIndex = 0;

        var token = {
            type: null,
            value: ""
        };

        while (match = re.exec(line)) {
            var type = "text";
            var value = match[0];

            if (re.lastIndex == lastIndex) { throw new Error("tokenizer error"); }
            lastIndex = re.lastIndex;

            for ( var i = 0; i < state.length; i++) {
                if (match[i + 1]) {
                    if (typeof state[i].token == "function") {
                        type = state[i].token(match[0]);
                    }
                    else {
                        type = state[i].token;
                    }

                    if (state[i].next && state[i].next !== currentState) {
                        currentState = state[i].next;
                        var state = this.rules[currentState];
                        var lastIndex = re.lastIndex;

                        var re = this.regExps[currentState];
                        re.lastIndex = lastIndex;
                    }
                    break;
                }
            };
            
                  
            if (token.type !== type) {
                if (token.type) {
                    tokens.push(token);
                }
                token = {
                    type: type,
                    value: value
                };
            } else {
                token.value += value;
            }
        };

        if (token.type) {
            tokens.push(token);
        }

        return {
            tokens : tokens,
            state : currentState
        };
    };

}).call(Tokenizer.prototype);

exports.Tokenizer = Tokenizer;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/undomanager', function(require, exports, module) {

var UndoManager = function() {
    this.$undoStack = [];
    this.$redoStack = [];
};

(function() {

    this.execute = function(options) {
        var deltas = options.args[0];
        this.$doc  = options.args[1];
        this.$undoStack.push(deltas);
    };

    this.undo = function() {
        var deltas = this.$undoStack.pop();
        if (deltas) {
            this.$doc.undoChanges(deltas);
            this.$redoStack.push(deltas);
        }
    };

    this.redo = function() {
        var deltas = this.$redoStack.pop();
        if (deltas) {
            this.$doc.redoChanges(deltas);
            this.$undoStack.push(deltas);
        }
    };

}).call(UndoManager.prototype);

exports.UndoManager = UndoManager;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/document', function(require, exports, module) {

var oop = require("pilot/oop");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var Range = require("ace/range").Range;

var Document = function(text) {
    this.$lines = [];

    if (Array.isArray(text)) {
        this.insertLines(0, text);
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);

    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insertLines(0, this.$split(text));
    };
  	
    this.getValue = function() {
        return this.$lines.join(this.getNewLineCharacter());
    };
    
    // check for IE split bug
    if ("aaa".split(/a/).length == 0)        
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        }
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };

    
    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r?\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };
    
    this.getNewLineCharacter = function() {
      switch (this.$newLineMode) {
          case "windows":
              return "\r\n";

          case "unix":
              return "\n";

          case "auto":
              return this.$autoNewLine;
      }
    },

    this.$autoNewLine = "\n";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode) return;

        this.$newLineMode = newLineMode;
    };

    this.getNewLineMode = function() {
        return this.$newLineMode;
    };
    
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };

    /**
     * Get a verbatim copy of the given line as it is in the document 
     */
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };
    
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow+1);
    };
    
    /**
     * Returns all lines in the document as string array. Warning: The caller 
     * should not modify this array!
     */
    this.getAllLines = function() {
        return this.$lines;
    };

    this.getLength = function() {
        return this.$lines.length;
    };

    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.$lines[range.start.row].substring(range.start.column,
                                                         range.end.column);
        }
        else {
            var lines = [];
            lines.push(this.$lines[range.start.row].substring(range.start.column));
            lines.push.apply(lines, this.getLines(range.start.row+1, range.end.row-1));
            lines.push(this.$lines[range.end.row].substring(0, range.end.column));
            return lines.join(this.getNewLineCharacter());
        }
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        }
        return position;        
    }

    this.insert = function(position, text) {
        if (text.length == 0)
            return position;
            
        position = this.$clipPosition(position);
            
        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var newLines = this.$split(text);

        if (this.isNewLine(text)) {
            var end = this.insertNewLine(position);
        }
        else if (newLines.length == 1) {
            var end = this.insertInLine(position, text);
        }
        else {
            var end = this.insertInLine(position, newLines[0]);
            this.insertNewLine(end);
            if (newLines.length > 2)
                this.insertLines(position.row+1, newLines.slice(1, newLines.length-1));
                
            var end = this.insertInLine({row: position.row + newLines.length - 1, column: 0}, newLines[newLines.length-1]);
        }

        return end;
    };
    
    this.insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};
            
        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);
    
        var range = new Range(row, 0, row + lines.length - 1, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._dispatchEvent("change", { data: delta });    
        return range.end;
    },
    
    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";
        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));
        
        var end = {
            row : position.row + 1,
            column : 0
        };
        
        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._dispatchEvent("change", { data: delta });
        
        return end;
    };
    
    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;
            
        var line = this.$lines[position.row] || "";
        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };
        
        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._dispatchEvent("change", { data: delta });
        
        return end;
    };

    this.remove = function(range) {
        // clip to document
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;
        
        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            
            // TODO removeInLine can be optimized away!
            this.removeInLine(lastRow, 0, range.end.column);
            if (lastRow - firstRow >= 2)
                this.removeLines(firstRow + 1, lastRow - 1);
            this.removeInLine(firstRow, range.start.column, this.$lines[firstRow].length);
            this.removeNewLine(range.start.row);
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };
    
    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;
            
        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);
        
        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._dispatchEvent("change", { data: delta });
        return range.start;
    };
    
    /**
     * Removes a range of full lines
     * 
     * @param firstRow {Integer} The first row to be removed
     * @param firstRow {Integer} The first row to be removed
     * @return {String[]} The removed lines
     */
    this.removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow, this.$lines[lastRow].length);        
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);
        
        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._dispatchEvent("change", { data: delta });
        return removed;
    };
    
    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);
        
        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;
        
        this.$lines.splice(row, 2, line);
        
        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._dispatchEvent("change", { data: delta });
    };
    
    this.replace = function(range, text) {
        if (text.length == 0 && range.isEmpty())
            return range.start;
        
        // Shortcut: If the text we want to insert is the same as it is already
        // in the document, we don't have to replace anything.
        if (text == this.getTextRange(range))
            return range.end;
    
        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }
    
        return end;
    };
    
    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = delta.range;
            
            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines)
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text)
            else if (delta.action == "removeLines")
                this.removeLines(range.start.row, range.end.row)
            else if (delta.action == "removeText")
                this.remove(range)
        }        
    };
    
    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];
            var range = delta.range;
            
            if (delta.action == "insertLines")
                this.removeLines(range.start.row, range.end.row)
            else if (delta.action == "insertText")
                this.remove(range)
            else if (delta.action == "removeLines")
                this.insertLines(range.start.row, delta.lines)
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text)
        }        
    };

}).call(Document.prototype);

exports.Document = Document;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/gutter', function(require, exports, module) {

var dom = require("pilot/dom");

var Gutter = function(parentEl) {
    this.element = document.createElement("div");
    this.element.className = "ace_layer ace_gutter-layer";
    parentEl.appendChild(this.element);

    this.$breakpoints = [];
    this.$decorations = [];
};

(function() {

    this.addGutterDecoration = function(row, className){
        if (!this.$decorations[row]) 
            this.$decorations[row] = "";
        this.$decorations[row] += " ace_" + className;
    }
    
    this.removeGutterDecoration = function(row, className){
        this.$decorations[row] = 
            this.$decorations[row].replace(" ace_" + className, "");
    }

    this.setBreakpoints = function(rows) {
        this.$breakpoints = rows.concat();
    };

    this.update = function(config) {
        this.$config = config;

        var html = [];
        for ( var i = config.firstRow; i <= config.lastRow; i++) {
            html.push("<div class='ace_gutter-cell",
                this.$decorations[i] || "",
                this.$breakpoints[i] ? " ace_breakpoint" : "",
                "' style='height:", config.lineHeight, "px;'>", (i+1), "</div>");
            html.push("</div>");
        }
		this.element = dom.setInnerHtml(this.element, html.join(""));
        this.element.style.height = config.minHeight + "px";
    };

}).call(Gutter.prototype);

exports.Gutter = Gutter;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/cursor', function(require, exports, module) {

var dom = require("pilot/dom");

var Cursor = function(parentEl) {
    this.element = document.createElement("div");
    this.element.className = "ace_layer ace_cursor-layer";
    parentEl.appendChild(this.element);

    this.cursor = document.createElement("div");
    this.cursor.className = "ace_cursor";

    this.isVisible = false;
};

(function() {

    this.setSession = function(session) {
        this.session = session;
    };

    this.setCursor = function(position, overwrite) {
        this.position = {
            row : position.row,
            column : this.session.documentToScreenColumn(position.row, position.column)
        };
        if (overwrite) {
            dom.addCssClass(this.cursor, "ace_overwrite");
        } else {
            dom.removeCssClass(this.cursor, "ace_overwrite");
        }
    };

    this.hideCursor = function() {
        this.isVisible = false;
        if (this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
        clearInterval(this.blinkId);
    };

    this.showCursor = function() {
        this.isVisible = true;
        this.element.appendChild(this.cursor);

        var cursor = this.cursor;
        cursor.style.visibility = "visible";
        this.restartTimer();
    };

    this.restartTimer = function() {
        clearInterval(this.blinkId);
        if (!this.isVisible) {
            return;
        }

        var cursor = this.cursor;
        this.blinkId = setInterval(function() {
            cursor.style.visibility = "hidden";
            setTimeout(function() {
                cursor.style.visibility = "visible";
            }, 400);
        }, 1000);
    };

    this.getPixelPosition = function() {
        if (!this.config || !this.position) {
            return {
                left : 0,
                top : 0
            };
        }

        var cursorLeft = Math.round(this.position.column * this.config.characterWidth);
        var cursorTop = this.position.row * this.config.lineHeight;

       return {
            left : cursorLeft,
            top : cursorTop
        };
    };

    this.update = function(config) {
        if (!this.position)
            return;

        this.config = config;

        var cursorLeft = Math.round(this.position.column * config.characterWidth);
        var cursorTop = this.position.row * config.lineHeight;

        this.pixelPos = {
            left : cursorLeft,
            top : cursorTop
        };

        this.cursor.style.left = cursorLeft + "px";
        this.cursor.style.top = (cursorTop - (config.firstRow * config.lineHeight))
                + "px";
        this.cursor.style.width = config.characterWidth + "px";
        this.cursor.style.height = config.lineHeight + "px";

        if (this.isVisible) {
            this.element.appendChild(this.cursor);
        }
        this.restartTimer();
    };

}).call(Cursor.prototype);

exports.Cursor = Cursor;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/marker', function(require, exports, module) {

var Range = require("ace/range").Range;
var dom = require("pilot/dom");

var Marker = function(parentEl) {
    this.element = document.createElement("div");
    this.element.className = "ace_layer ace_marker-layer";
    parentEl.appendChild(this.element);

    this.markers = {};
    this.$markerId = 1;
};

(function() {

    this.setSession = function(session) {
        this.session = session;
    };

    this.addMarker = function(range, clazz, type) {
        var id = this.$markerId++;
        this.markers[id] = {
            range : range,
            type : type || "line",
            clazz : clazz
        };

        return id;
    };

    this.removeMarker = function(markerId) {
        var marker = this.markers[markerId];
        if (marker) {
            delete (this.markers[markerId]);
        }
    };

    this.update = function(config) {
        var config = config || this.config;
        if (!config)
            return;

        this.config = config;

        var html = [];
        for ( var key in this.markers) {
            var marker = this.markers[key];

            var range = marker.range.clipRows(config.firstRow, config.lastRow);
            if (range.isEmpty()) continue;

            if (range.isMultiLine()) {
                if (marker.type == "text") {
                    this.drawTextMarker(html, range, marker.clazz, config);
                } else {
                    this.drawMultiLineMarker(html, range, marker.clazz, config);
                }
            }
            else {
                this.drawSingleLineMarker(html, range, marker.clazz, config);
            }
        }
        this.element = dom.setInnerHtml(this.element, html.join(""));
    };

    this.drawTextMarker = function(stringBuilder, range, clazz, layerConfig) {

        // selection start
        var row = range.start.row;
        var lineRange = new Range(row, range.start.column, row, this.session.getLine(row).length);
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 1);

        // selection end
        var row = range.end.row;
        var lineRange = new Range(row, 0, row, range.end.column);
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig);

        for (var row = range.start.row + 1; row < range.end.row; row++) {
            lineRange.start.row = row;
            lineRange.end.row = row;
            lineRange.end.column = this.session.getLine(row).length; // account for endofline characters
            this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 1);
        }
    };

    this.drawMultiLineMarker = function(stringBuilder, range, clazz, layerConfig) {
        var range = range.toScreenRange(this.session);

        // from selection start to the end of the line
        var height = layerConfig.lineHeight;
        var width = Math.round(layerConfig.width - (range.start.column * layerConfig.characterWidth));
        var top = (range.start.row - layerConfig.firstRow) * layerConfig.lineHeight;
        var left = Math.round(range.start.column * layerConfig.characterWidth);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", left, "px;'></div>"
        );

        // from start of the last line to the selection end
        var top = (range.end.row - layerConfig.firstRow) * layerConfig.lineHeight;
        var width = Math.round(range.end.column * layerConfig.characterWidth);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "width:", width, "px;'></div>"
        );

        // all the complete lines
        var height = (range.end.row - range.start.row - 1) * layerConfig.lineHeight;
        if (height < 0)
            return;
        var top = (range.start.row + 1 - layerConfig.firstRow) * layerConfig.lineHeight;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", layerConfig.width, "px;",
            "top:", top, "px;'></div>"
        );
    };

    this.drawSingleLineMarker = function(stringBuilder, range, clazz, layerConfig, extraLength) {
        var range = range.toScreenRange(this.session);

        var height = layerConfig.lineHeight;
        var width = Math.round((range.end.column + (extraLength || 0) - range.start.column) * layerConfig.characterWidth);
        var top = (range.start.row - layerConfig.firstRow) * layerConfig.lineHeight;
        var left = Math.round(range.start.column * layerConfig.characterWidth);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", left,"px;'></div>"
        );
    };

}).call(Marker.prototype);

exports.Marker = Marker;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/text', function(require, exports, module) {

var oop = require("pilot/oop");
var dom = require("pilot/dom");
var lang = require("pilot/lang");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var Text = function(parentEl) {
    this.element = document.createElement("div");
    this.element.className = "ace_layer ace_text-layer";
    parentEl.appendChild(this.element);

    this.$characterSize = this.$measureSizes();
    this.$pollSizeChanges();
};

(function() {

    oop.implement(this, EventEmitter);

    this.EOF_CHAR = "&para;";
    this.EOL_CHAR = "&not;";
    this.TAB_CHAR = "&rarr;";
    this.SPACE_CHAR = "&middot;";

    this.setTokenizer = function(tokenizer) {
        this.tokenizer = tokenizer;
    };

    this.getLineHeight = function() {
        return this.$characterSize.height || 1;
    };

    this.getCharacterWidth = function() {
        return this.$characterSize.width || 1;
    };

    this.$pollSizeChanges = function() {
        var self = this;
        setInterval(function() {
            var size = self.$measureSizes();
            if (self.$characterSize.width !== size.width || self.$characterSize.height !== size.height) {
                self.$characterSize = size;
                self._dispatchEvent("changeCharaterSize", {data: size});
            }
        }, 500);
    };

    this.$fontStyles = {
        fontFamily : 1,
        fontSize : 1,
        fontWeight : 1,
        fontStyle : 1,
        lineHeight : 1
    },

    this.$measureSizes = function() {
        var n = 1000;
        if (!this.$measureNode) {
	        var measureNode = this.$measureNode = document.createElement("div");
	        var style = measureNode.style;
	
	        style.width = style.height = "auto";
	        style.left = style.top = "-1000px";
	        
	        style.visibility = "hidden";
	        style.position = "absolute";
	        style.overflow = "visible";
	        style.whiteSpace = "nowrap";
	
	        // in FF 3.6 monospace fonts can have a fixed sub pixel width.
	        // that's why we have to measure many characters
	        // Note: characterWidth can be a float!
	        measureNode.innerHTML = lang.stringRepeat("Xy", n);
	        document.body.insertBefore(measureNode, document.body.firstChild);
        }

        var style = this.$measureNode.style;
        for (var prop in this.$fontStyles) {
            var value = dom.computedStyle(this.element, prop);
            style[prop] = value;
        }

        var size = {
            height: this.$measureNode.offsetHeight,
            width: this.$measureNode.offsetWidth / (n * 2)
        };
        return size;
    };

    this.setSession = function(session) {
        this.session = session;
    };

    this.showInvisibles = false;
    this.setShowInvisibles = function(showInvisibles) {
        if (this.showInvisibles == showInvisibles)
            return false;
            
        this.showInvisibles = showInvisibles;
        return true;
    };

    this.$computeTabString = function() {
        var tabSize = this.session.getTabSize();
        if (this.showInvisibles) {
            var halfTab = (tabSize) / 2;
            this.$tabString = "<span class='ace_invisible'>"
                + new Array(Math.floor(halfTab)).join("&nbsp;")
                + this.TAB_CHAR
                + new Array(Math.ceil(halfTab)+1).join("&nbsp;")
                + "</span>";
        } else {
            this.$tabString = new Array(tabSize+1).join("&nbsp;");
        }
    };

    this.updateLines = function(layerConfig, firstRow, lastRow) {
        this.$computeTabString();
        this.config = layerConfig;
        
        var first = Math.max(firstRow, layerConfig.firstRow);
        var last = Math.min(lastRow, layerConfig.lastRow);

        var lineElements = this.element.childNodes;
        var tokens = this.tokenizer.getTokens(first, last);
        for (var i=first; i<=last; i++) {
            var lineElement = lineElements[i - layerConfig.firstRow];
            if (!lineElement)
                continue;

            var html = [];
            this.$renderLine(html, i, tokens[i-first].tokens);
            dom.setInnerHtml(lineElement, html.join(""));
        }
    };

    this.scrollLines = function(config) {
        this.$computeTabString();
        var oldConfig = this.config;
        this.config = config;

        if (!oldConfig || oldConfig.lastRow < config.firstRow)
            return this.update(config);

        if (config.lastRow < oldConfig.firstRow)
            return this.update(config);

        var el = this.element;

        if (oldConfig.firstRow < config.firstRow)
            for (var row=oldConfig.firstRow; row<config.firstRow; row++)
                el.removeChild(el.firstChild);

        if (oldConfig.lastRow > config.lastRow)
            for (var row=config.lastRow+1; row<=oldConfig.lastRow; row++)
                el.removeChild(el.lastChild);

        if (config.firstRow < oldConfig.firstRow) {
            var fragment = this.$renderLinesFragment(config, config.firstRow, oldConfig.firstRow - 1);
            if (el.firstChild)
                el.insertBefore(fragment, el.firstChild);
            else
                el.appendChild(fragment);
        }
               
        if (config.lastRow > oldConfig.lastRow) {
            var fragment = this.$renderLinesFragment(config, oldConfig.lastRow + 1, config.lastRow);
            el.appendChild(fragment);
        }
    };

    this.$renderLinesFragment = function(config, firstRow, lastRow) {
        var fragment = document.createDocumentFragment();
        var tokens = this.tokenizer.getTokens(firstRow, lastRow);
        for (var row=firstRow; row<=lastRow; row++) {
            var lineEl = document.createElement("div");
            lineEl.className = "ace_line";
            var style = lineEl.style;
            style.height = this.$characterSize.height + "px";
            style.width = config.width + "px";

            var html = [];
            this.$renderLine(html, row, tokens[row-firstRow].tokens);
            // don't use setInnerHtml since we are working with an empty DIV
            lineEl.innerHTML = html.join("");
            fragment.appendChild(lineEl);
        }
        return fragment;
    };

    this.update = function(config) {
        this.$computeTabString();
        this.config = config;

        var html = [];
        var tokens = this.tokenizer.getTokens(config.firstRow, config.lastRow);
        for (var i=config.firstRow; i<=config.lastRow; i++) {
            html.push("<div class='ace_line' style='height:" + this.$characterSize.height + "px;", "width:",
                    config.width, "px'>");
            this.$renderLine(html, i, tokens[i-config.firstRow].tokens), html.push("</div>");
        }

        this.element = dom.setInnerHtml(this.element, html.join(""));
    };

    this.$textToken = {
        "text": true,
        "rparen": true,
        "lparen": true
    };

    this.$renderLine = function(stringBuilder, row, tokens) {
//        if (this.showInvisibles) {
//            var self = this;
//            var spaceRe = /[\v\f \u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]+/g;
//            var spaceReplace = function(space) {
//                var space = new Array(space.length+1).join(self.SPACE_CHAR);
//                return "<span class='ace_invisible'>" + space + "</span>";
//            };
//        }
//        else {
            var spaceRe = /[\v\f \u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]/g;
            var spaceReplace = "&nbsp;";
//        }

        for ( var i = 0; i < tokens.length; i++) {
            var token = tokens[i];

            var output = token.value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(spaceRe, spaceReplace)
                .replace(/\t/g, this.$tabString);

            if (!this.$textToken[token.type]) {
                var classes = "ace_" + token.type.replace(/\./g, " ace_");
                stringBuilder.push("<span class='", classes, "'>", output, "</span>");
            }
            else {
                stringBuilder.push(output);
            }
        };

        if (this.showInvisibles) {
            if (row !== this.session.getLength() - 1) {
                stringBuilder.push("<span class='ace_invisible'>" + this.EOL_CHAR + "</span>");
            } else {
                stringBuilder.push("<span class='ace_invisible'>" + this.EOF_CHAR + "</span>");
            }
        }
    };

}).call(Text.prototype);

exports.Text = Text;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/renderloop', function(require, exports, module) {

var event = require("pilot/event");

var RenderLoop = function(onRender) {
    this.onRender = onRender;
    this.pending = false;
    this.changes = 0;
};

(function() {

    this.schedule = function(change) {
        //this.onRender(change);
        //return;
        this.changes = this.changes | change;
        if (!this.pending) {
            this.pending = true;
            var _self = this;
            this.setTimeoutZero(function() {
                _self.pending = false;
                var changes = _self.changes;
                _self.changes = 0;
                _self.onRender(changes);
            })
        }
    };

    if (window.postMessage) {

        this.messageName = "zero-timeout-message";

        this.setTimeoutZero = function(callback) {
            if (!this.attached) {
                var _self = this;
                event.addListener(window, "message", function(e) {
                    if (_self.callback && e.data == _self.messageName) {
                        event.stopPropagation(e);
                        _self.callback();
                    }
                });
                this.attached = true;
            }
            this.callback = callback;
            window.postMessage(this.messageName, "*");
        }

    } else {

        this.setTimeoutZero = function(callback) {
            setTimeout(callback, 0);
        }
    }

}).call(RenderLoop.prototype);

exports.RenderLoop = RenderLoop;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/c_cpp_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var DocCommentHighlightRules = require("ace/mode/doc_comment_highlight_rules").DocCommentHighlightRules;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

c_cppHighlightRules = function() {

    var docComment = new DocCommentHighlightRules();

    var keywords = lang.arrayToMap(
        ("and|double|not_eq|throw|and_eq|dynamic_cast|operator|true|" +
        "asm|else|or|try|auto|enum|or_eq|typedef|bitand|explicit|private|" +
        "typeid|bitor|extern|protected|typename|bool|false|public|union|" +
        "break|float|register|unsigned|case|fro|reinterpret-cast|using|catch|" +
        "friend|return|virtual|char|goto|short|void|class|if|signed|volatile|" +
        "compl|inline|sizeof|wchar_t|const|int|static|while|const-cast|long|" +
        "static_cast|xor|continue|mutable|struct|xor_eq|default|namespace|" +
        "switch|delete|new|template|do|not|this|for").split("|")
    );
    
    var buildinConstants = lang.arrayToMap(
        ("NULL").split("|")
    );
    
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [
	        {
	            token : "comment",
	            regex : "\\/\\/.*$"
	        },
	        docComment.getStartRule("doc-start"),
	        {
	            token : "comment", // multi line comment
	            regex : "\\/\\*",
	            next : "comment"
	        }, {
	            token : "string", // single line
	            regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
	        }, {
	            token : "string", // multi line string start
	            regex : '["].*\\\\$',
	            next : "qqstring"
	        }, {
	            token : "string", // single line
	            regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
	        }, {
	            token : "string", // multi line string start
	            regex : "['].*\\\\$",
	            next : "qstring"
	        }, {
	            token : "constant.numeric", // hex
	            regex : "0[xX][0-9a-fA-F]+\\b"
	        }, {
	            token : "constant.numeric", // float
	            regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
	        }, {
              token : "constant", // <CONSTANT>
              regex : "<[a-zA-Z0-9.]+>"
	        }, {
              token : "keyword", // pre-compiler directivs
              regex : "(?:#include|#pragma|#line|#define|#undef|#ifdef|#else|#elif|#endif|#ifndef)"
          }, {
	            token : function(value) {
	                if (value == "this")
	                    return "variable.language";
	                else if (keywords[value])
	                    return "keyword";
	                else if (buildinConstants[value])
	                    return "constant.language";
	                else if (value == "debugger")
	                    return "invalid.deprecated";
	                else
	                    return "identifier";
	            },
	            // TODO: Unicode escape sequences
	            // TODO: Unicode identifiers
	            regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
	        }, {
	            token : "keyword.operator",
	            regex : "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|==|=|!=|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|new|delete|typeof|void)"
	        }, {
	            token : "lparen",
	            regex : "[[({]"
	        }, {
	            token : "rparen",
	            regex : "[\\])}]"
	        }, {
	            token : "text",
	            regex : "\\s+"
	        }
        ],
        "comment" : [
	        {
	            token : "comment", // closing comment
	            regex : ".*?\\*\\/",
	            next : "start"
	        }, {
	            token : "comment", // comment spanning whole line
	            regex : ".+"
	        }
        ],
        "qqstring" : [
            {
	            token : "string",
	            regex : '(?:(?:\\\\.)|(?:[^"\\\\]))*?"',
	            next : "start"
	        }, {
	            token : "string",
	            regex : '.+'
	        }
        ],
        "qstring" : [
	        {
	            token : "string",
	            regex : "(?:(?:\\\\.)|(?:[^'\\\\]))*?'",
	            next : "start"
	        }, {
	            token : "string",
	            regex : '.+'
	        }
        ]
    };

    this.addRules(docComment.getRules(), "doc-");
    this.$rules["doc-start"][0].next = "start";
};

oop.inherits(c_cppHighlightRules, TextHighlightRules);

exports.c_cppHighlightRules = c_cppHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/c_cpp', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var c_cppHighlightRules = require("ace/mode/c_cpp_highlight_rules").c_cppHighlightRules;
var MatchingBraceOutdent = require("ace/mode/matching_brace_outdent").MatchingBraceOutdent;
var Range = require("ace/range").Range;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new c_cppHighlightRules().getRules());
    this.$outdent = new MatchingBraceOutdent();
};
oop.inherits(Mode, TextMode);

(function() {

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        var outdent = true;
        var outentedRows = [];
        var re = /^(\s*)\/\//;

        for (var i=startRow; i<= endRow; i++) {
            if (!re.test(doc.getLine(i))) {
                outdent = false;
                break;
            }
        }

        if (outdent) {
            var deleteRange = new Range(0, 0, 0, 0);
            for (var i=startRow; i<= endRow; i++)
            {
                var line = doc.getLine(i).replace(re, "$1");
                deleteRange.start.row = i;
                deleteRange.end.row = i;
                deleteRange.end.column = line.length + 2;
                doc.replace(deleteRange, line);
            }
            return -2;
        }
        else {
            return doc.indentRows(startRow, endRow, "//");
        }
    };

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.$tokenizer.getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }
        
        if (state == "start") {
            var match = line.match(/^.*[\{\(\[]\s*$/);
            if (match) {
                indent += tab;
            }
        } else if (state == "doc-start") {
            if (endState == "start") {
                return "";
            }
            var match = line.match(/^\s*(\/?)\*/);
            if (match) {
                if (match[1]) {
                    indent += " ";
                }
                indent += "* ";
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        return this.$outdent.autoOutdent(doc, row);
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/html', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var JavaScriptMode = require("ace/mode/javascript").Mode;
var CssMode = require("ace/mode/css").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var HtmlHighlightRules = require("ace/mode/html_highlight_rules").HtmlHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new HtmlHighlightRules().getRules());

    this.$js = new JavaScriptMode();
    this.$css = new CssMode();
};
oop.inherits(Mode, TextMode);

(function() {

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        return this.$delegate("toggleCommentLines", arguments, function() {
            return 0;
        });
    };

    this.getNextLineIndent = function(state, line, tab) {
        var self = this;
        return this.$delegate("getNextLineIndent", arguments, function() {
            return self.$getIndent(line);
        });
    };

    this.checkOutdent = function(state, line, input) {
        return this.$delegate("checkOutdent", arguments, function() {
            return false;
        });
    };

    this.autoOutdent = function(state, doc, row) {
        return this.$delegate("autoOutdent", arguments);
    };

    this.$delegate = function(method, args, defaultHandler) {
        var state = args[0];
        var split = state.split("js-");

        if (!split[0] && split[1]) {
            args[0] = split[1];
            return this.$js[method].apply(this.$js, args);
        }

        var split = state.split("css-");
        if (!split[0] && split[1]) {
            args[0] = split[1];
            return this.$css[method].apply(this.$css, args);
        }

        return defaultHandler ? defaultHandler() : undefined;
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Ajax.org Code Editor (ACE).
*
* The Initial Developer of the Original Code is
* Ajax.org B.V.
* Portions created by the Initial Developer are Copyright (C) 2010
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*      Fabian Jakobs <fabian AT ajax DOT org>
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */

define('ace/mode/python', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var PythonHighlightRules = require("ace/mode/python_highlight_rules").PythonHighlightRules;
var MatchingBraceOutdent = require("ace/mode/matching_brace_outdent").MatchingBraceOutdent;
var Range = require("ace/range").Range;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new PythonHighlightRules().getRules());
    this.$outdent = new MatchingBraceOutdent();
};
oop.inherits(Mode, TextMode);

(function() {

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        var outdent = true;
        var outentedRows = [];
        var re = /^(\s*)#/;

        for (var i=startRow; i<= endRow; i++) {
            if (!re.test(doc.getLine(i))) {
                outdent = false;
                break;
            }
        }

        if (outdent) {
            var deleteRange = new Range(0, 0, 0, 0);
            for (var i=startRow; i<= endRow; i++)
            {
                var line = doc.getLine(i).replace(re, "$1");
                deleteRange.start.row = i;
                deleteRange.end.row = i;
                deleteRange.end.column = line.length + 2;
                doc.replace(deleteRange, line);
            }
            return -2;
        }
        else {
            return doc.indentRows(startRow, endRow, "#");
        }
    };

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.$tokenizer.getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        if (state == "start") {
            var match = line.match(/^.*[\{\(\[\:]\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        return this.$outdent.autoOutdent(doc, row);
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/javascript', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var JavaScriptHighlightRules = require("ace/mode/javascript_highlight_rules").JavaScriptHighlightRules;
var MatchingBraceOutdent = require("ace/mode/matching_brace_outdent").MatchingBraceOutdent;
var Range = require("ace/range").Range;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new JavaScriptHighlightRules().getRules());
    this.$outdent = new MatchingBraceOutdent();
};
oop.inherits(Mode, TextMode);

(function() {

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        var outdent = true;
        var outentedRows = [];
        var re = /^(\s*)\/\//;

        for (var i=startRow; i<= endRow; i++) {
            if (!re.test(doc.getLine(i))) {
                outdent = false;
                break;
            }
        }

        if (outdent) {
            var deleteRange = new Range(0, 0, 0, 0);
            for (var i=startRow; i<= endRow; i++)
            {
                var line = doc.getLine(i).replace(re, "$1");
                deleteRange.start.row = i;
                deleteRange.end.row = i;
                deleteRange.end.column = line.length + 2;
                doc.replace(deleteRange, line);
            }
            return -2;
        }
        else {
            return doc.indentRows(startRow, endRow, "//");
        }
    };

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.$tokenizer.getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }
        
        if (state == "start") {
            var match = line.match(/^.*[\{\(\[]\s*$/);
            if (match) {
                indent += tab;
            }
        } else if (state == "doc-start") {
            if (endState == "start") {
                return "";
            }
            var match = line.match(/^\s*(\/?)\*/);
            if (match) {
                if (match[1]) {
                    indent += " ";
                }
                indent += "* ";
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        return this.$outdent.autoOutdent(doc, row);
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/text_highlight_rules', function(require, exports, module) {

var TextHighlightRules = function() {

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [ {
            token : "text",
            regex : ".+"
        } ]
    };
};

(function() {

    this.addRules = function(rules, prefix) {
        for (var key in rules) {
            var state = rules[key];
            for (var i=0; i<state.length; i++) {
                var rule = state[i];
                if (rule.next) {
                    rule.next = prefix + rule.next;
                } else {
                    rule.next = prefix + key;
                }
            }
            this.$rules[prefix + key] = state;
        }
    };

    this.getRules = function() {
        return this.$rules;
    };

}).call(TextHighlightRules.prototype);

exports.TextHighlightRules = TextHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/doc_comment_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var DocCommentHighlightRules = function() {

    this.$rules = {
        "start" : [ {
            token : "comment.doc", // closing comment
            regex : "\\*\\/",
            next : "start"
        }, {
            token : "comment.doc.tag",
            regex : "@[\\w\\d_]+" // TODO: fix email addresses
        }, {
            token : "comment.doc",
            regex : "\s+"
        }, {
            token : "comment.doc",
            regex : "TODO"
        }, {
            token : "comment.doc",
            regex : "[^@\\*]+"
        }, {
            token : "comment.doc",
            regex : "."
        }]
    };
};

oop.inherits(DocCommentHighlightRules, TextHighlightRules);

(function() {

    this.getStartRule = function(start) {
        return {
            token : "comment.doc", // doc comment
            regex : "\\/\\*(?=\\*)",
            next: start
        };
    };

}).call(DocCommentHighlightRules.prototype);

exports.DocCommentHighlightRules = DocCommentHighlightRules;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****
 *
 * TODO: python delimiters
 */

define('ace/mode/python_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

PythonHighlightRules = function() {

    var keywords = lang.arrayToMap(
        ("and|as|assert|break|class|continue|def|del|elif|else|except|exec|" +
        "finally|for|from|global|if|import|in|is|lambda|not|or|pass|print|" +
        "raise|return|try|while|with|yield").split("|")
    );

    var builtinConstants = lang.arrayToMap(
        ("True|False|None|NotImplemented|Ellipsis|__debug__").split("|")
    );

    var builtinFunctions = lang.arrayToMap(
        ("abs|divmod|input|open|staticmethod|all|enumerate|int|ord|str|any|" +
        "eval|isinstance|pow|sum|basestring|execfile|issubclass|print|super|" +
        "binfile|iter|property|tuple|bool|filter|len|range|type|bytearray|" +
        "float|list|raw_input|unichr|callable|format|locals|reduce|unicode|" +
        "chr|frozenset|long|reload|vars|classmethod|getattr|map|repr|xrange|" +
        "cmp|globals|max|reversed|zip|compile|hasattr|memoryview|round|" +
        "__import__|complex|hash|min|set|apply|delattr|help|next|setattr|" +
        "buffer|dict|hex|object|slice|coerce|dir|id|oct|sorted|intern").split("|")
    );

    var futureReserved = lang.arrayToMap(
        ("").split("|")
    );

    var strPre = "(?:(?:[rubRUB])|(?:[ubUB][rR]))?";

    var decimalInteger = "(?:(?:[1-9]\\d*)|(?:0))";
    var octInteger = "(?:0[oO]?[0-7]+)";
    var hexInteger = "(?:0[xX][\\dA-Fa-f]+)";
    var binInteger = "(?:0[bB][01]+)";
    var integer = "(?:" + decimalInteger + "|" + octInteger + "|" + hexInteger + "|" + binInteger + ")";

    var exponent = "(?:[eE][+-]?\\d+)";
    var fraction = "(?:\\.\\d+)";
    var intPart = "(?:\\d+)";
    var pointFloat = "(?:(?:" + intPart + "?" + fraction + ")|(?:" + intPart + "\\.))";
    var exponentFloat = "(?:(?:" + pointFloat + "|" +  intPart + ")" + exponent + ")";
    var floatNumber = "(?:" + exponentFloat + "|" + pointFloat + ")";

    this.$rules = {
        "start" : [ {
            token : "comment",
            regex : "#.*$"
        }, {
            token : "string",           // """ string
            regex : strPre + '"{3}(?:(?:.)|(?:^"{3}))*?"{3}'
        }, {
            token : "string",           // multi line """ string start
            regex : strPre + '"{3}.*$',
            next : "qqstring"
        }, {
            token : "string",           // " string
            regex : strPre + '"(?:(?:\\\\.)|(?:[^"\\\\]))*?"'
        }, {
            token : "string",           // ''' string
            regex : strPre + "'{3}(?:(?:.)|(?:^'{3}))*?'{3}"
        }, {
            token : "string",           // multi line ''' string start
            regex : strPre + "'{3}.*$",
            next : "qstring"
        }, {
            token : "string",           // ' string
            regex : strPre + "'(?:(?:\\\\.)|(?:[^'\\\\]))*?'"
        }, {
            token : "constant.numeric", // imaginary
            regex : "(?:" + floatNumber + "|\\d+)[jJ]\\b"
        }, {
            token : "constant.numeric", // float
            regex : floatNumber
        }, {
            token : "constant.numeric", // long integer
            regex : integer + "[lL]\\b"
        }, {
            token : "constant.numeric", // integer
            regex : integer + "\\b"
        }, {
            token : function(value) {
                if (keywords[value])
                    return "keyword";
                else if (builtinConstants[value])
                    return "constant.language";
                else if (futureReserved[value])
                    return "invalid.illegal";
                else if (builtinFunctions[value])
                    return "support.function";
                else if (value == "debugger")
                    return "invalid.deprecated";
                else
                    return "identifier";
            },
            regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
        }, {
            token : "keyword.operator",
            regex : "\\+|\\-|\\*|\\*\\*|\\/|\\/\\/|%|<<|>>|&|\\||\\^|~|<|>|<=|=>|==|!=|<>|="
        }, {
            token : "lparen",
            regex : "[\\[\\(\\{]"
        }, {
            token : "rparen",
            regex : "[\\]\\)\\}]"
        }, {
            token : "text",
            regex : "\\s+"
        } ],
        "qqstring" : [ {
            token : "string",           // multi line """ string end
            regex : '(?:^"{3})*?"{3}',
            next : "start"
        }, {
            token : "string",
            regex : '.+'
        } ],
        "qstring" : [ {
            token : "string",           // multi line ''' string end
            regex : "(?:^'{3})*?'{3}",
            next : "start"
        }, {
            token : "string",
            regex : '.+'
        } ]
    };
};

oop.inherits(PythonHighlightRules, TextHighlightRules);

exports.PythonHighlightRules = PythonHighlightRules;
});/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/css', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var CssHighlightRules = require("ace/mode/css_highlight_rules").CssHighlightRules;
var MatchingBraceOutdent = require("ace/mode/matching_brace_outdent").MatchingBraceOutdent;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new CssHighlightRules().getRules());
    this.$outdent = new MatchingBraceOutdent();
};
oop.inherits(Mode, TextMode);

(function() {

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        // ignore braces in comments
        var tokens = this.$tokenizer.getLineTokens(line, state).tokens;
        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        var match = line.match(/^.*\{\s*$/);
        if (match) {
            indent += tab;
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        return this.$outdent.autoOutdent(doc, row);
    };

}).call(Mode.prototype);

exports.Mode = Mode;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/xml', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var XmlHighlightRules = require("ace/mode/xml_highlight_rules").XmlHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new XmlHighlightRules().getRules());
};

oop.inherits(Mode, TextMode);

(function() {

    this.getNextLineIndent = function(state, line, tab) {
        return this.$getIndent(line);
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/html_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var CssHighlightRules = require("ace/mode/css_highlight_rules").CssHighlightRules;
var JavaScriptHighlightRules = require("ace/mode/javascript_highlight_rules").JavaScriptHighlightRules;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var HtmlHighlightRules = function() {

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used

    this.$rules = {
        start : [ {
            token : "text",
            regex : "<\\!\\[CDATA\\[",
            next : "cdata"
        }, {
            token : "xml_pe",
            regex : "<\\?.*?\\?>"
        }, {
            token : "comment",
            regex : "<\\!--",
            next : "comment"
        }, {
            token : "text",
            regex : "<(?=\s*script)",
            next : "script"
        }, {
            token : "text",
            regex : "<(?=\s*style)",
            next : "css"
        }, {
            token : "text", // opening tag
            regex : "<\\/?",
            next : "tag"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "text",
            regex : "[^<]+"
        } ],

        script : [ {
            token : "text",
            regex : ">",
            next : "js-start"
        }, {
            token : "keyword",
            regex : "[-_a-zA-Z0-9:]+"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "string",
            regex : '".*?"'
        }, {
            token : "string",
            regex : "'.*?'"
        } ],

        css : [ {
            token : "text",
            regex : ">",
            next : "css-start"
        }, {
            token : "keyword",
            regex : "[-_a-zA-Z0-9:]+"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "string",
            regex : '".*?"'
        }, {
            token : "string",
            regex : "'.*?'"
        } ],

        tag : [ {
            token : "text",
            regex : ">",
            next : "start"
        }, {
            token : "keyword",
            regex : "[-_a-zA-Z0-9:]+"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "string",
            regex : '".*?"'
        }, {
            token : "string",
            regex : "'.*?'"
        } ],

        cdata : [ {
            token : "text",
            regex : "\\]\\]>",
            next : "start"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "text",
            regex : ".+"
        } ],

        comment : [ {
            token : "comment",
            regex : ".*?-->",
            next : "start"
        }, {
            token : "comment",
            regex : ".+"
        } ]
    };

    var jsRules = new JavaScriptHighlightRules().getRules();
    this.addRules(jsRules, "js-");
    this.$rules["js-start"].unshift({
        token: "comment",
        regex: "\\/\\/.*(?=<\\/script>)",
        next: "tag"
    }, {
        token: "text",
        regex: "<\\/(?=script)",
        next: "tag"
    });

    var cssRules = new CssHighlightRules().getRules();
    this.addRules(cssRules, "css-");
    this.$rules["css-start"].unshift({
        token: "text",
        regex: "<\\/(?=style)",
        next: "tag"
    });
};

oop.inherits(HtmlHighlightRules, TextHighlightRules);

exports.HtmlHighlightRules = HtmlHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/javascript_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var DocCommentHighlightRules = require("ace/mode/doc_comment_highlight_rules").DocCommentHighlightRules;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

JavaScriptHighlightRules = function() {

    var docComment = new DocCommentHighlightRules();

    var keywords = lang.arrayToMap(
        ("break|case|catch|continue|default|delete|do|else|finally|for|function|" +
        "if|in|instanceof|new|return|switch|throw|try|typeof|var|while|with").split("|")
    );
    
    var buildinConstants = lang.arrayToMap(
        ("null|Infinity|NaN|undefined").split("|")
    );
    
    var futureReserved = lang.arrayToMap(
        ("class|enum|extends|super|const|export|import|implements|let|private|" +
        "public|yield|interface|package|protected|static").split("|")
    );

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [
	        {
	            token : "comment",
	            regex : "\\/\\/.*$"
	        },
	        docComment.getStartRule("doc-start"),
	        {
	            token : "comment", // multi line comment
	            regex : "\\/\\*",
	            next : "comment"
	        }, {
	            token : "string.regexp",
	            regex : "[/](?:(?:\\[(?:\\\\]|[^\\]])+\\])|(?:\\\\/|[^\\]/]))*[/]\\w*\\s*(?=[).,;]|$)"
	        }, {
	            token : "string", // single line
	            regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
	        }, {
	            token : "string", // multi line string start
	            regex : '["].*\\\\$',
	            next : "qqstring"
	        }, {
	            token : "string", // single line
	            regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
	        }, {
	            token : "string", // multi line string start
	            regex : "['].*\\\\$",
	            next : "qstring"
	        }, {
	            token : "constant.numeric", // hex
	            regex : "0[xX][0-9a-fA-F]+\\b"
	        }, {
	            token : "constant.numeric", // float
	            regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
	        }, {
	            token : "constant.language.boolean",
	            regex : "(?:true|false)\\b"
	        }, {
	            token : function(value) {
	                if (value == "this")
	                    return "variable.language";
	                else if (keywords[value])
	                    return "keyword";
	                else if (buildinConstants[value])
	                    return "constant.language";
	                else if (futureReserved[value])
	                    return "invalid.illegal";
	                else if (value == "debugger")
	                    return "invalid.deprecated";
	                else
	                    return "identifier";
	            },
	            // TODO: Unicode escape sequences
	            // TODO: Unicode identifiers
	            regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
	        }, {
	            token : "keyword.operator",
	            regex : "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|instanceof|new|delete|typeof|void)"
	        }, {
	            token : "lparen",
	            regex : "[[({]"
	        }, {
	            token : "rparen",
	            regex : "[\\])}]"
	        }, {
	            token : "text",
	            regex : "\\s+"
	        }
        ],
        "comment" : [
	        {
	            token : "comment", // closing comment
	            regex : ".*?\\*\\/",
	            next : "start"
	        }, {
	            token : "comment", // comment spanning whole line
	            regex : ".+"
	        }
        ],
        "qqstring" : [
            {
	            token : "string",
	            regex : '(?:(?:\\\\.)|(?:[^"\\\\]))*?"',
	            next : "start"
	        }, {
	            token : "string",
	            regex : '.+'
	        }
        ],
        "qstring" : [
	        {
	            token : "string",
	            regex : "(?:(?:\\\\.)|(?:[^'\\\\]))*?'",
	            next : "start"
	        }, {
	            token : "string",
	            regex : '.+'
	        }
        ]
    };

    this.addRules(docComment.getRules(), "doc-");
    this.$rules["doc-start"][0].next = "start";
};

oop.inherits(JavaScriptHighlightRules, TextHighlightRules);

exports.JavaScriptHighlightRules = JavaScriptHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      André Fiedler <fiedler dot andre a t gmail dot com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** 
 */

define('ace/mode/php_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var DocCommentHighlightRules = require("ace/mode/doc_comment_highlight_rules").DocCommentHighlightRules;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

PhpHighlightRules = function() {

    var docComment = new DocCommentHighlightRules();

	var builtinFunctions = lang.arrayToMap(
	    ('abs|acos|acosh|addcslashes|addslashes|aggregate|aggregate_info|aggregate_methods|' +
        'aggregate_methods_by_list|aggregate_methods_by_regexp|aggregate_properties|aggregate_properties_by_list|' +
        'aggregate_properties_by_regexp|aggregation_info|apache_child_terminate|apache_get_modules|' +
        'apache_get_version|apache_getenv|apache_lookup_uri|apache_note|apache_request_headers|' +
        'apache_response_headers|apache_setenv|array|array_change_key_case|array_chunk|array_combine|' +
        'array_count_values|array_diff|array_diff_assoc|array_diff_uassoc|array_fill|array_filter|array_flip|' +
        'array_intersect|array_intersect_assoc|array_key_exists|array_keys|array_map|array_merge|' +
        'array_merge_recursive|array_multisort|array_pad|array_pop|array_push|array_rand|array_reduce|' +
        'array_reverse|array_search|array_shift|array_slice|array_splice|array_sum|array_udiff|array_udiff_assoc|' +
        'array_udiff_uassoc|array_unique|array_unshift|array_values|array_walk|arsort|ascii2ebcdic|asin|asinh|asort|' +
        'aspell_check|aspell_check_raw|aspell_new|aspell_suggest|assert|assert_options|atan|atan2|atanh|' +
        'base64_decode|base64_encode|base_convert|basename|bcadd|bccomp|bcdiv|bcmod|bcmul|bcpow|bcpowmod|bcscale|' +
        'bcsqrt|bcsub|bin2hex|bind_textdomain_codeset|bindec|bindtextdomain|bzclose|bzcompress|bzdecompress|bzerrno|' +
        'bzerror|bzerrstr|bzflush|bzopen|bzread|bzwrite|cal_days_in_month|cal_from_jd|cal_info|cal_to_jd|' +
        'call_user_func|call_user_func_array|call_user_method|call_user_method_array|ccvs_add|ccvs_auth|ccvs_command|' +
        'ccvs_count|ccvs_delete|ccvs_done|ccvs_init|ccvs_lookup|ccvs_new|ccvs_report|ccvs_return|ccvs_reverse|' +
        'ccvs_sale|ccvs_status|ccvs_textvalue|ccvs_void|ceil|chdir|checkdate|checkdnsrr|chgrp|chmod|chop|chown|chr|' +
        'chroot|chunk_split|class_exists|clearstatcache|closedir|closelog|com|com_addref|com_get|com_invoke|' +
        'com_isenum|com_load|com_load_typelib|com_propget|com_propput|com_propset|com_release|com_set|compact|' +
        'connection_aborted|connection_status|connection_timeout|constant|convert_cyr_string|copy|cos|cosh|count|' +
        'count_chars|cpdf_add_annotation|cpdf_add_outline|cpdf_arc|cpdf_begin_text|cpdf_circle|cpdf_clip|cpdf_close|' +
        'cpdf_closepath|cpdf_closepath_fill_stroke|cpdf_closepath_stroke|cpdf_continue_text|cpdf_curveto|cpdf_end_text|' +
        'cpdf_fill|cpdf_fill_stroke|cpdf_finalize|cpdf_finalize_page|cpdf_global_set_document_limits|cpdf_import_jpeg|' +
        'cpdf_lineto|cpdf_moveto|cpdf_newpath|cpdf_open|cpdf_output_buffer|cpdf_page_init|cpdf_place_inline_image|' +
        'cpdf_rect|cpdf_restore|cpdf_rlineto|cpdf_rmoveto|cpdf_rotate|cpdf_rotate_text|cpdf_save|cpdf_save_to_file|' +
        'cpdf_scale|cpdf_set_action_url|cpdf_set_char_spacing|cpdf_set_creator|cpdf_set_current_page|cpdf_set_font|' +
        'cpdf_set_font_directories|cpdf_set_font_map_file|cpdf_set_horiz_scaling|cpdf_set_keywords|cpdf_set_leading|' +
        'cpdf_set_page_animation|cpdf_set_subject|cpdf_set_text_matrix|cpdf_set_text_pos|cpdf_set_text_rendering|' +
        'cpdf_set_text_rise|cpdf_set_title|cpdf_set_viewer_preferences|cpdf_set_word_spacing|cpdf_setdash|cpdf_setflat|' +
        'cpdf_setgray|cpdf_setgray_fill|cpdf_setgray_stroke|cpdf_setlinecap|cpdf_setlinejoin|cpdf_setlinewidth|' +
        'cpdf_setmiterlimit|cpdf_setrgbcolor|cpdf_setrgbcolor_fill|cpdf_setrgbcolor_stroke|cpdf_show|cpdf_show_xy|' +
        'cpdf_stringwidth|cpdf_stroke|cpdf_text|cpdf_translate|crack_check|crack_closedict|crack_getlastmessage|' +
        'crack_opendict|crc32|create_function|crypt|ctype_alnum|ctype_alpha|ctype_cntrl|ctype_digit|ctype_graph|' +
        'ctype_lower|ctype_print|ctype_punct|ctype_space|ctype_upper|ctype_xdigit|curl_close|curl_errno|curl_error|' +
        'curl_exec|curl_getinfo|curl_init|curl_multi_add_handle|curl_multi_close|curl_multi_exec|curl_multi_getcontent|' +
        'curl_multi_info_read|curl_multi_init|curl_multi_remove_handle|curl_multi_select|curl_setopt|curl_version|current|' +
        'cybercash_base64_decode|cybercash_base64_encode|cybercash_decr|cybercash_encr|cyrus_authenticate|cyrus_bind|' +
        'cyrus_close|cyrus_connect|cyrus_query|cyrus_unbind|date|dba_close|dba_delete|dba_exists|dba_fetch|dba_firstkey|' +
        'dba_handlers|dba_insert|dba_key_split|dba_list|dba_nextkey|dba_open|dba_optimize|dba_popen|dba_replace|dba_sync|' +
        'dbase_add_record|dbase_close|dbase_create|dbase_delete_record|dbase_get_header_info|dbase_get_record|' +
        'dbase_get_record_with_names|dbase_numfields|dbase_numrecords|dbase_open|dbase_pack|dbase_replace_record|dblist|' +
        'dbmclose|dbmdelete|dbmexists|dbmfetch|dbmfirstkey|dbminsert|dbmnextkey|dbmopen|dbmreplace|dbplus_add|dbplus_aql|' +
        'dbplus_chdir|dbplus_close|dbplus_curr|dbplus_errcode|dbplus_errno|dbplus_find|dbplus_first|dbplus_flush|' +
        'dbplus_freealllocks|dbplus_freelock|dbplus_freerlocks|dbplus_getlock|dbplus_getunique|dbplus_info|dbplus_last|' +
        'dbplus_lockrel|dbplus_next|dbplus_open|dbplus_prev|dbplus_rchperm|dbplus_rcreate|dbplus_rcrtexact|dbplus_rcrtlike|' +
        'dbplus_resolve|dbplus_restorepos|dbplus_rkeys|dbplus_ropen|dbplus_rquery|dbplus_rrename|dbplus_rsecindex|' +
        'dbplus_runlink|dbplus_rzap|dbplus_savepos|dbplus_setindex|dbplus_setindexbynumber|dbplus_sql|dbplus_tcl|' +
        'dbplus_tremove|dbplus_undo|dbplus_undoprepare|dbplus_unlockrel|dbplus_unselect|dbplus_update|dbplus_xlockrel|' +
        'dbplus_xunlockrel|dbx_close|dbx_compare|dbx_connect|dbx_error|dbx_escape_string|dbx_fetch_row|dbx_query|dbx_sort|' +
        'dcgettext|dcngettext|deaggregate|debug_backtrace|debug_print_backtrace|debugger_off|debugger_on|decbin|dechex|' +
        'decoct|define|define_syslog_variables|defined|deg2rad|delete|dgettext|die|dio_close|dio_fcntl|dio_open|dio_read|' +
        'dio_seek|dio_stat|dio_tcsetattr|dio_truncate|dio_write|dir|dirname|disk_free_space|disk_total_space|diskfreespace|' +
        'dl|dngettext|dns_check_record|dns_get_mx|dns_get_record|domxml_new_doc|domxml_open_file|domxml_open_mem|' +
        'domxml_version|domxml_xmltree|domxml_xslt_stylesheet|domxml_xslt_stylesheet_doc|domxml_xslt_stylesheet_file|' +
        'dotnet_load|doubleval|each|easter_date|easter_days|ebcdic2ascii|echo|empty|end|ereg|ereg_replace|eregi|' +
        'eregi_replace|error_log|error_reporting|escapeshellarg|escapeshellcmd|eval|exec|exif_imagetype|exif_read_data|' +
        'exif_thumbnail|exit|exp|explode|expm1|extension_loaded|extract|ezmlm_hash|fam_cancel_monitor|fam_close|' +
        'fam_monitor_collection|fam_monitor_directory|fam_monitor_file|fam_next_event|fam_open|fam_pending|' +
        'fam_resume_monitor|fam_suspend_monitor|fbsql_affected_rows|fbsql_autocommit|fbsql_blob_size|fbsql_change_user|' +
        'fbsql_clob_size|fbsql_close|fbsql_commit|fbsql_connect|fbsql_create_blob|fbsql_create_clob|fbsql_create_db|' +
        'fbsql_data_seek|fbsql_database|fbsql_database_password|fbsql_db_query|fbsql_db_status|fbsql_drop_db|fbsql_errno|' +
        'fbsql_error|fbsql_fetch_array|fbsql_fetch_assoc|fbsql_fetch_field|fbsql_fetch_lengths|fbsql_fetch_object|' +
        'fbsql_fetch_row|fbsql_field_flags|fbsql_field_len|fbsql_field_name|fbsql_field_seek|fbsql_field_table|' +
        'fbsql_field_type|fbsql_free_result|fbsql_get_autostart_info|fbsql_hostname|fbsql_insert_id|fbsql_list_dbs|' +
        'fbsql_list_fields|fbsql_list_tables|fbsql_next_result|fbsql_num_fields|fbsql_num_rows|fbsql_password|fbsql_pconnect|' +
        'fbsql_query|fbsql_read_blob|fbsql_read_clob|fbsql_result|fbsql_rollback|fbsql_select_db|fbsql_set_lob_mode|' +
        'fbsql_set_password|fbsql_set_transaction|fbsql_start_db|fbsql_stop_db|fbsql_tablename|fbsql_username|fbsql_warnings|' +
        'fclose|fdf_add_doc_javascript|fdf_add_template|fdf_close|fdf_create|fdf_enum_values|fdf_errno|fdf_error|fdf_get_ap|' +
        'fdf_get_attachment|fdf_get_encoding|fdf_get_file|fdf_get_flags|fdf_get_opt|fdf_get_status|fdf_get_value|' +
        'fdf_get_version|fdf_header|fdf_next_field_name|fdf_open|fdf_open_string|fdf_remove_item|fdf_save|fdf_save_string|' +
        'fdf_set_ap|fdf_set_encoding|fdf_set_file|fdf_set_flags|fdf_set_javascript_action|fdf_set_opt|fdf_set_status|' +
        'fdf_set_submit_form_action|fdf_set_target_frame|fdf_set_value|fdf_set_version|feof|fflush|fgetc|fgetcsv|fgets|' +
        'fgetss|file|file_exists|file_get_contents|file_put_contents|fileatime|filectime|filegroup|fileinode|filemtime|' +
        'fileowner|fileperms|filepro|filepro_fieldcount|filepro_fieldname|filepro_fieldtype|filepro_fieldwidth|' +
        'filepro_retrieve|filepro_rowcount|filesize|filetype|floatval|flock|floor|flush|fmod|fnmatch|fopen|fpassthru|fprintf|' +
        'fputs|fread|frenchtojd|fribidi_log2vis|fscanf|fseek|fsockopen|fstat|ftell|ftok|ftp_alloc|ftp_cdup|ftp_chdir|ftp_chmod|' +
        'ftp_close|ftp_connect|ftp_delete|ftp_exec|ftp_fget|ftp_fput|ftp_get|ftp_get_option|ftp_login|ftp_mdtm|ftp_mkdir|' +
        'ftp_nb_continue|ftp_nb_fget|ftp_nb_fput|ftp_nb_get|ftp_nb_put|ftp_nlist|ftp_pasv|ftp_put|ftp_pwd|ftp_quit|ftp_raw|' +
        'ftp_rawlist|ftp_rename|ftp_rmdir|ftp_set_option|ftp_site|ftp_size|ftp_ssl_connect|ftp_systype|ftruncate|func_get_arg|' +
        'func_get_args|func_num_args|function_exists|fwrite|gd_info|get_browser|get_cfg_var|get_class|get_class_methods|' +
        'get_class_vars|get_current_user|get_declared_classes|get_declared_interfaces|get_defined_constants|' +
        'get_defined_functions|get_defined_vars|get_extension_funcs|get_headers|get_html_translation_table|get_include_path|' +
        'get_included_files|get_loaded_extensions|get_magic_quotes_gpc|get_magic_quotes_runtime|get_meta_tags|get_object_vars|' +
        'get_parent_class|get_required_files|get_resource_type|getallheaders|getcwd|getdate|getenv|gethostbyaddr|gethostbyname|' +
        'gethostbynamel|getimagesize|getlastmod|getmxrr|getmygid|getmyinode|getmypid|getmyuid|getopt|getprotobyname|' +
        'getprotobynumber|getrandmax|getrusage|getservbyname|getservbyport|gettext|gettimeofday|gettype|glob|gmdate|gmmktime|' +
        'gmp_abs|gmp_add|gmp_and|gmp_clrbit|gmp_cmp|gmp_com|gmp_div|gmp_div_q|gmp_div_qr|gmp_div_r|gmp_divexact|gmp_fact|' +
        'gmp_gcd|gmp_gcdext|gmp_hamdist|gmp_init|gmp_intval|gmp_invert|gmp_jacobi|gmp_legendre|gmp_mod|gmp_mul|gmp_neg|gmp_or|' +
        'gmp_perfect_square|gmp_popcount|gmp_pow|gmp_powm|gmp_prob_prime|gmp_random|gmp_scan0|gmp_scan1|gmp_setbit|gmp_sign|' +
        'gmp_sqrt|gmp_sqrtrem|gmp_strval|gmp_sub|gmp_xor|gmstrftime|gregoriantojd|gzclose|gzcompress|gzdeflate|gzencode|gzeof|' +
        'gzfile|gzgetc|gzgets|gzgetss|gzinflate|gzopen|gzpassthru|gzputs|gzread|gzrewind|gzseek|gztell|gzuncompress|gzwrite|' +
        'header|headers_list|headers_sent|hebrev|hebrevc|hexdec|highlight_file|highlight_string|html_entity_decode|htmlentities|' +
        'htmlspecialchars|http_build_query|hw_api_attribute|hw_api_content|hw_api_object|hw_array2objrec|hw_changeobject|' +
        'hw_children|hw_childrenobj|hw_close|hw_connect|hw_connection_info|hw_cp|hw_deleteobject|hw_docbyanchor|hw_docbyanchorobj|' +
        'hw_document_attributes|hw_document_bodytag|hw_document_content|hw_document_setcontent|hw_document_size|hw_dummy|' +
        'hw_edittext|hw_error|hw_errormsg|hw_free_document|hw_getanchors|hw_getanchorsobj|hw_getandlock|hw_getchildcoll|' +
        'hw_getchildcollobj|hw_getchilddoccoll|hw_getchilddoccollobj|hw_getobject|hw_getobjectbyquery|hw_getobjectbyquerycoll|' +
        'hw_getobjectbyquerycollobj|hw_getobjectbyqueryobj|hw_getparents|hw_getparentsobj|hw_getrellink|hw_getremote|' +
        'hw_getremotechildren|hw_getsrcbydestobj|hw_gettext|hw_getusername|hw_identify|hw_incollections|hw_info|hw_inscoll|' +
        'hw_insdoc|hw_insertanchors|hw_insertdocument|hw_insertobject|hw_mapid|hw_modifyobject|hw_mv|hw_new_document|' +
        'hw_objrec2array|hw_output_document|hw_pconnect|hw_pipedocument|hw_root|hw_setlinkroot|hw_stat|hw_unlock|hw_who|' +
        'hwapi_hgcsp|hypot|ibase_add_user|ibase_affected_rows|ibase_backup|ibase_blob_add|ibase_blob_cancel|ibase_blob_close|' +
        'ibase_blob_create|ibase_blob_echo|ibase_blob_get|ibase_blob_import|ibase_blob_info|ibase_blob_open|ibase_close|' +
        'ibase_commit|ibase_commit_ret|ibase_connect|ibase_db_info|ibase_delete_user|ibase_drop_db|ibase_errcode|ibase_errmsg|' +
        'ibase_execute|ibase_fetch_assoc|ibase_fetch_object|ibase_fetch_row|ibase_field_info|ibase_free_event_handler|' +
        'ibase_free_query|ibase_free_result|ibase_gen_id|ibase_maintain_db|ibase_modify_user|ibase_name_result|ibase_num_fields|' +
        'ibase_num_params|ibase_param_info|ibase_pconnect|ibase_prepare|ibase_query|ibase_restore|ibase_rollback|ibase_rollback_ret|' +
        'ibase_server_info|ibase_service_attach|ibase_service_detach|ibase_set_event_handler|ibase_timefmt|ibase_trans|' +
        'ibase_wait_event|iconv|iconv_get_encoding|iconv_mime_decode|iconv_mime_decode_headers|iconv_mime_encode|iconv_set_encoding|' +
        'iconv_strlen|iconv_strpos|iconv_strrpos|iconv_substr|idate|ifx_affected_rows|ifx_blobinfile_mode|ifx_byteasvarchar|' +
        'ifx_close|ifx_connect|ifx_copy_blob|ifx_create_blob|ifx_create_char|ifx_do|ifx_error|ifx_errormsg|ifx_fetch_row|' +
        'ifx_fieldproperties|ifx_fieldtypes|ifx_free_blob|ifx_free_char|ifx_free_result|ifx_get_blob|ifx_get_char|ifx_getsqlca|' +
        'ifx_htmltbl_result|ifx_nullformat|ifx_num_fields|ifx_num_rows|ifx_pconnect|ifx_prepare|ifx_query|ifx_textasvarchar|' +
        'ifx_update_blob|ifx_update_char|ifxus_close_slob|ifxus_create_slob|ifxus_free_slob|ifxus_open_slob|ifxus_read_slob|' +
        'ifxus_seek_slob|ifxus_tell_slob|ifxus_write_slob|ignore_user_abort|image2wbmp|image_type_to_mime_type|imagealphablending|' +
        'imageantialias|imagearc|imagechar|imagecharup|imagecolorallocate|imagecolorallocatealpha|imagecolorat|imagecolorclosest|' +
        'imagecolorclosestalpha|imagecolorclosesthwb|imagecolordeallocate|imagecolorexact|imagecolorexactalpha|imagecolormatch|' +
        'imagecolorresolve|imagecolorresolvealpha|imagecolorset|imagecolorsforindex|imagecolorstotal|imagecolortransparent|imagecopy|' +
        'imagecopymerge|imagecopymergegray|imagecopyresampled|imagecopyresized|imagecreate|imagecreatefromgd|imagecreatefromgd2|' +
        'imagecreatefromgd2part|imagecreatefromgif|imagecreatefromjpeg|imagecreatefrompng|imagecreatefromstring|imagecreatefromwbmp|' +
        'imagecreatefromxbm|imagecreatefromxpm|imagecreatetruecolor|imagedashedline|imagedestroy|imageellipse|imagefill|imagefilledarc|' +
        'imagefilledellipse|imagefilledpolygon|imagefilledrectangle|imagefilltoborder|imagefilter|imagefontheight|imagefontwidth|' +
        'imageftbbox|imagefttext|imagegammacorrect|imagegd|imagegd2|imagegif|imageinterlace|imageistruecolor|imagejpeg|imagelayereffect|' +
        'imageline|imageloadfont|imagepalettecopy|imagepng|imagepolygon|imagepsbbox|imagepscopyfont|imagepsencodefont|imagepsextendfont|' +
        'imagepsfreefont|imagepsloadfont|imagepsslantfont|imagepstext|imagerectangle|imagerotate|imagesavealpha|imagesetbrush|' +
        'imagesetpixel|imagesetstyle|imagesetthickness|imagesettile|imagestring|imagestringup|imagesx|imagesy|imagetruecolortopalette|' +
        'imagettfbbox|imagettftext|imagetypes|imagewbmp|imagexbm|imap_8bit|imap_alerts|imap_append|imap_base64|imap_binary|imap_body|' +
        'imap_bodystruct|imap_check|imap_clearflag_full|imap_close|imap_createmailbox|imap_delete|imap_deletemailbox|imap_errors|' +
        'imap_expunge|imap_fetch_overview|imap_fetchbody|imap_fetchheader|imap_fetchstructure|imap_get_quota|imap_get_quotaroot|' +
        'imap_getacl|imap_getmailboxes|imap_getsubscribed|imap_header|imap_headerinfo|imap_headers|imap_last_error|imap_list|' +
        'imap_listmailbox|imap_listscan|imap_listsubscribed|imap_lsub|imap_mail|imap_mail_compose|imap_mail_copy|imap_mail_move|' +
        'imap_mailboxmsginfo|imap_mime_header_decode|imap_msgno|imap_num_msg|imap_num_recent|imap_open|imap_ping|imap_qprint|' +
        'imap_renamemailbox|imap_reopen|imap_rfc822_parse_adrlist|imap_rfc822_parse_headers|imap_rfc822_write_address|imap_scanmailbox|' +
        'imap_search|imap_set_quota|imap_setacl|imap_setflag_full|imap_sort|imap_status|imap_subscribe|imap_thread|imap_timeout|' +
        'imap_uid|imap_undelete|imap_unsubscribe|imap_utf7_decode|imap_utf7_encode|imap_utf8|implode|import_request_variables|in_array|' +
        'ingres_autocommit|ingres_close|ingres_commit|ingres_connect|ingres_fetch_array|ingres_fetch_object|ingres_fetch_row|' +
        'ingres_field_length|ingres_field_name|ingres_field_nullable|ingres_field_precision|ingres_field_scale|ingres_field_type|' +
        'ingres_num_fields|ingres_num_rows|ingres_pconnect|ingres_query|ingres_rollback|ini_alter|ini_get|ini_get_all|ini_restore|' +
        'ini_set|intval|ip2long|iptcembed|iptcparse|ircg_channel_mode|ircg_disconnect|ircg_fetch_error_msg|ircg_get_username|' +
        'ircg_html_encode|ircg_ignore_add|ircg_ignore_del|ircg_invite|ircg_is_conn_alive|ircg_join|ircg_kick|ircg_list|' +
        'ircg_lookup_format_messages|ircg_lusers|ircg_msg|ircg_nick|ircg_nickname_escape|ircg_nickname_unescape|ircg_notice|ircg_oper|' +
        'ircg_part|ircg_pconnect|ircg_register_format_messages|ircg_set_current|ircg_set_file|ircg_set_on_die|ircg_topic|ircg_who|' +
        'ircg_whois|is_a|is_array|is_bool|is_callable|is_dir|is_double|is_executable|is_file|is_finite|is_float|is_infinite|is_int|' +
        'is_integer|is_link|is_long|is_nan|is_null|is_numeric|is_object|is_readable|is_real|is_resource|is_scalar|is_soap_fault|' +
        'is_string|is_subclass_of|is_uploaded_file|is_writable|is_writeable|isset|java_last_exception_clear|java_last_exception_get|' +
        'jddayofweek|jdmonthname|jdtofrench|jdtogregorian|jdtojewish|jdtojulian|jdtounix|jewishtojd|join|jpeg2wbmp|juliantojd|key|' +
        'krsort|ksort|lcg_value|ldap_8859_to_t61|ldap_add|ldap_bind|ldap_close|ldap_compare|ldap_connect|ldap_count_entries|ldap_delete|' +
        'ldap_dn2ufn|ldap_err2str|ldap_errno|ldap_error|ldap_explode_dn|ldap_first_attribute|ldap_first_entry|ldap_first_reference|' +
        'ldap_free_result|ldap_get_attributes|ldap_get_dn|ldap_get_entries|ldap_get_option|ldap_get_values|ldap_get_values_len|ldap_list|' +
        'ldap_mod_add|ldap_mod_del|ldap_mod_replace|ldap_modify|ldap_next_attribute|ldap_next_entry|ldap_next_reference|' +
        'ldap_parse_reference|ldap_parse_result|ldap_read|ldap_rename|ldap_search|ldap_set_option|ldap_set_rebind_proc|ldap_sort|' +
        'ldap_start_tls|ldap_t61_to_8859|ldap_unbind|levenshtein|link|linkinfo|list|localeconv|localtime|log|log10|log1p|long2ip|lstat|' +
        'ltrim|lzf_compress|lzf_decompress|lzf_optimized_for|mail|mailparse_determine_best_xfer_encoding|mailparse_msg_create|' +
        'mailparse_msg_extract_part|mailparse_msg_extract_part_file|mailparse_msg_free|mailparse_msg_get_part|mailparse_msg_get_part_data|' +
        'mailparse_msg_get_structure|mailparse_msg_parse|mailparse_msg_parse_file|mailparse_rfc822_parse_addresses|' +
        'mailparse_stream_encode|mailparse_uudecode_all|main|max|mb_convert_case|mb_convert_encoding|mb_convert_kana|mb_convert_variables|' +
        'mb_decode_mimeheader|mb_decode_numericentity|mb_detect_encoding|mb_detect_order|mb_encode_mimeheader|mb_encode_numericentity|' +
        'mb_ereg|mb_ereg_match|mb_ereg_replace|mb_ereg_search|mb_ereg_search_getpos|mb_ereg_search_getregs|mb_ereg_search_init|' +
        'mb_ereg_search_pos|mb_ereg_search_regs|mb_ereg_search_setpos|mb_eregi|mb_eregi_replace|mb_get_info|mb_http_input|mb_http_output|' +
        'mb_internal_encoding|mb_language|mb_output_handler|mb_parse_str|mb_preferred_mime_name|mb_regex_encoding|mb_regex_set_options|' +
        'mb_send_mail|mb_split|mb_strcut|mb_strimwidth|mb_strlen|mb_strpos|mb_strrpos|mb_strtolower|mb_strtoupper|mb_strwidth|' +
        'mb_substitute_character|mb_substr|mb_substr_count|mcal_append_event|mcal_close|mcal_create_calendar|mcal_date_compare|' +
        'mcal_date_valid|mcal_day_of_week|mcal_day_of_year|mcal_days_in_month|mcal_delete_calendar|mcal_delete_event|' +
        'mcal_event_add_attribute|mcal_event_init|mcal_event_set_alarm|mcal_event_set_category|mcal_event_set_class|' +
        'mcal_event_set_description|mcal_event_set_end|mcal_event_set_recur_daily|mcal_event_set_recur_monthly_mday|' +
        'mcal_event_set_recur_monthly_wday|mcal_event_set_recur_none|mcal_event_set_recur_weekly|mcal_event_set_recur_yearly|' +
        'mcal_event_set_start|mcal_event_set_title|mcal_expunge|mcal_fetch_current_stream_event|mcal_fetch_event|mcal_is_leap_year|' +
        'mcal_list_alarms|mcal_list_events|mcal_next_recurrence|mcal_open|mcal_popen|mcal_rename_calendar|mcal_reopen|mcal_snooze|' +
        'mcal_store_event|mcal_time_valid|mcal_week_of_year|mcrypt_cbc|mcrypt_cfb|mcrypt_create_iv|mcrypt_decrypt|mcrypt_ecb|' +
        'mcrypt_enc_get_algorithms_name|mcrypt_enc_get_block_size|mcrypt_enc_get_iv_size|mcrypt_enc_get_key_size|mcrypt_enc_get_modes_name|' +
        'mcrypt_enc_get_supported_key_sizes|mcrypt_enc_is_block_algorithm|mcrypt_enc_is_block_algorithm_mode|mcrypt_enc_is_block_mode|' +
        'mcrypt_enc_self_test|mcrypt_encrypt|mcrypt_generic|mcrypt_generic_deinit|mcrypt_generic_end|mcrypt_generic_init|' +
        'mcrypt_get_block_size|mcrypt_get_cipher_name|mcrypt_get_iv_size|mcrypt_get_key_size|mcrypt_list_algorithms|mcrypt_list_modes|' +
        'mcrypt_module_close|mcrypt_module_get_algo_block_size|mcrypt_module_get_algo_key_size|mcrypt_module_get_supported_key_sizes|' +
        'mcrypt_module_is_block_algorithm|mcrypt_module_is_block_algorithm_mode|mcrypt_module_is_block_mode|mcrypt_module_open|' +
        'mcrypt_module_self_test|mcrypt_ofb|mcve_adduser|mcve_adduserarg|mcve_bt|mcve_checkstatus|mcve_chkpwd|mcve_chngpwd|' +
        'mcve_completeauthorizations|mcve_connect|mcve_connectionerror|mcve_deleteresponse|mcve_deletetrans|mcve_deleteusersetup|' +
        'mcve_deluser|mcve_destroyconn|mcve_destroyengine|mcve_disableuser|mcve_edituser|mcve_enableuser|mcve_force|mcve_getcell|' +
        'mcve_getcellbynum|mcve_getcommadelimited|mcve_getheader|mcve_getuserarg|mcve_getuserparam|mcve_gft|mcve_gl|mcve_gut|mcve_initconn|' +
        'mcve_initengine|mcve_initusersetup|mcve_iscommadelimited|mcve_liststats|mcve_listusers|mcve_maxconntimeout|mcve_monitor|' +
        'mcve_numcolumns|mcve_numrows|mcve_override|mcve_parsecommadelimited|mcve_ping|mcve_preauth|mcve_preauthcompletion|mcve_qc|' +
        'mcve_responseparam|mcve_return|mcve_returncode|mcve_returnstatus|mcve_sale|mcve_setblocking|mcve_setdropfile|mcve_setip|' +
        'mcve_setssl|mcve_setssl_files|mcve_settimeout|mcve_settle|mcve_text_avs|mcve_text_code|mcve_text_cv|mcve_transactionauth|' +
        'mcve_transactionavs|mcve_transactionbatch|mcve_transactioncv|mcve_transactionid|mcve_transactionitem|mcve_transactionssent|' +
        'mcve_transactiontext|mcve_transinqueue|mcve_transnew|mcve_transparam|mcve_transsend|mcve_ub|mcve_uwait|mcve_verifyconnection|' +
        'mcve_verifysslcert|mcve_void|md5|md5_file|mdecrypt_generic|memory_get_usage|metaphone|method_exists|mhash|mhash_count|' +
        'mhash_get_block_size|mhash_get_hash_name|mhash_keygen_s2k|microtime|mime_content_type|min|ming_setcubicthreshold|ming_setscale|' +
        'ming_useswfversion|mkdir|mktime|money_format|move_uploaded_file|msession_connect|msession_count|msession_create|msession_destroy|' +
        'msession_disconnect|msession_find|msession_get|msession_get_array|msession_getdata|msession_inc|msession_list|msession_listvar|' +
        'msession_lock|msession_plugin|msession_randstr|msession_set|msession_set_array|msession_setdata|msession_timeout|msession_uniq|' +
        'msession_unlock|msg_get_queue|msg_receive|msg_remove_queue|msg_send|msg_set_queue|msg_stat_queue|msql|msql|msql_affected_rows|' +
        'msql_close|msql_connect|msql_create_db|msql_createdb|msql_data_seek|msql_dbname|msql_drop_db|msql_error|msql_fetch_array|' +
        'msql_fetch_field|msql_fetch_object|msql_fetch_row|msql_field_flags|msql_field_len|msql_field_name|msql_field_seek|msql_field_table|' +
        'msql_field_type|msql_fieldflags|msql_fieldlen|msql_fieldname|msql_fieldtable|msql_fieldtype|msql_free_result|msql_list_dbs|' +
        'msql_list_fields|msql_list_tables|msql_num_fields|msql_num_rows|msql_numfields|msql_numrows|msql_pconnect|msql_query|msql_regcase|' +
        'msql_result|msql_select_db|msql_tablename|mssql_bind|mssql_close|mssql_connect|mssql_data_seek|mssql_execute|mssql_fetch_array|' +
        'mssql_fetch_assoc|mssql_fetch_batch|mssql_fetch_field|mssql_fetch_object|mssql_fetch_row|mssql_field_length|mssql_field_name|' +
        'mssql_field_seek|mssql_field_type|mssql_free_result|mssql_free_statement|mssql_get_last_message|mssql_guid_string|mssql_init|' +
        'mssql_min_error_severity|mssql_min_message_severity|mssql_next_result|mssql_num_fields|mssql_num_rows|mssql_pconnect|mssql_query|' +
        'mssql_result|mssql_rows_affected|mssql_select_db|mt_getrandmax|mt_rand|mt_srand|muscat_close|muscat_get|muscat_give|muscat_setup|' +
        'muscat_setup_net|mysql_affected_rows|mysql_change_user|mysql_client_encoding|mysql_close|mysql_connect|mysql_create_db|' +
        'mysql_data_seek|mysql_db_name|mysql_db_query|mysql_drop_db|mysql_errno|mysql_error|mysql_escape_string|mysql_fetch_array|' +
        'mysql_fetch_assoc|mysql_fetch_field|mysql_fetch_lengths|mysql_fetch_object|mysql_fetch_row|mysql_field_flags|mysql_field_len|' +
        'mysql_field_name|mysql_field_seek|mysql_field_table|mysql_field_type|mysql_free_result|mysql_get_client_info|mysql_get_host_info|' +
        'mysql_get_proto_info|mysql_get_server_info|mysql_info|mysql_insert_id|mysql_list_dbs|mysql_list_fields|mysql_list_processes|' +
        'mysql_list_tables|mysql_num_fields|mysql_num_rows|mysql_pconnect|mysql_ping|mysql_query|mysql_real_escape_string|mysql_result|' +
        'mysql_select_db|mysql_stat|mysql_tablename|mysql_thread_id|mysql_unbuffered_query|mysqli_affected_rows|mysqli_autocommit|' +
        'mysqli_bind_param|mysqli_bind_result|mysqli_change_user|mysqli_character_set_name|mysqli_client_encoding|mysqli_close|mysqli_commit|' +
        'mysqli_connect|mysqli_connect_errno|mysqli_connect_error|mysqli_data_seek|mysqli_debug|mysqli_disable_reads_from_master|' +
        'mysqli_disable_rpl_parse|mysqli_dump_debug_info|mysqli_embedded_connect|mysqli_enable_reads_from_master|mysqli_enable_rpl_parse|' +
        'mysqli_errno|mysqli_error|mysqli_escape_string|mysqli_execute|mysqli_fetch|mysqli_fetch_array|mysqli_fetch_assoc|mysqli_fetch_field|' +
        'mysqli_fetch_field_direct|mysqli_fetch_fields|mysqli_fetch_lengths|mysqli_fetch_object|mysqli_fetch_row|mysqli_field_count|' +
        'mysqli_field_seek|mysqli_field_tell|mysqli_free_result|mysqli_get_client_info|mysqli_get_client_version|mysqli_get_host_info|' +
        'mysqli_get_metadata|mysqli_get_proto_info|mysqli_get_server_info|mysqli_get_server_version|mysqli_info|mysqli_init|mysqli_insert_id|' +
        'mysqli_kill|mysqli_master_query|mysqli_more_results|mysqli_multi_query|mysqli_next_result|mysqli_num_fields|mysqli_num_rows|' +
        'mysqli_options|mysqli_param_count|mysqli_ping|mysqli_prepare|mysqli_query|mysqli_real_connect|mysqli_real_escape_string|' +
        'mysqli_real_query|mysqli_report|mysqli_rollback|mysqli_rpl_parse_enabled|mysqli_rpl_probe|mysqli_rpl_query_type|mysqli_select_db|' +
        'mysqli_send_long_data|mysqli_send_query|mysqli_server_end|mysqli_server_init|mysqli_set_opt|mysqli_sqlstate|mysqli_ssl_set|mysqli_stat|' +
        'mysqli_stmt_init|mysqli_stmt_affected_rows|mysqli_stmt_bind_param|mysqli_stmt_bind_result|mysqli_stmt_close|mysqli_stmt_data_seek|' +
        'mysqli_stmt_errno|mysqli_stmt_error|mysqli_stmt_execute|mysqli_stmt_fetch|mysqli_stmt_free_result|mysqli_stmt_num_rows|' +
        'mysqli_stmt_param_count|mysqli_stmt_prepare|mysqli_stmt_result_metadata|mysqli_stmt_send_long_data|mysqli_stmt_sqlstate|' +
        'mysqli_stmt_store_result|mysqli_store_result|mysqli_thread_id|mysqli_thread_safe|mysqli_use_result|mysqli_warning_count|natcasesort|' +
        'natsort|ncurses_addch|ncurses_addchnstr|ncurses_addchstr|ncurses_addnstr|ncurses_addstr|ncurses_assume_default_colors|ncurses_attroff|' +
        'ncurses_attron|ncurses_attrset|ncurses_baudrate|ncurses_beep|ncurses_bkgd|ncurses_bkgdset|ncurses_border|ncurses_bottom_panel|' +
        'ncurses_can_change_color|ncurses_cbreak|ncurses_clear|ncurses_clrtobot|ncurses_clrtoeol|ncurses_color_content|ncurses_color_set|' +
        'ncurses_curs_set|ncurses_def_prog_mode|ncurses_def_shell_mode|ncurses_define_key|ncurses_del_panel|ncurses_delay_output|ncurses_delch|' +
        'ncurses_deleteln|ncurses_delwin|ncurses_doupdate|ncurses_echo|ncurses_echochar|ncurses_end|ncurses_erase|ncurses_erasechar|' +
        'ncurses_filter|ncurses_flash|ncurses_flushinp|ncurses_getch|ncurses_getmaxyx|ncurses_getmouse|ncurses_getyx|ncurses_halfdelay|' +
        'ncurses_has_colors|ncurses_has_ic|ncurses_has_il|ncurses_has_key|ncurses_hide_panel|ncurses_hline|ncurses_inch|ncurses_init|' +
        'ncurses_init_color|ncurses_init_pair|ncurses_insch|ncurses_insdelln|ncurses_insertln|ncurses_insstr|ncurses_instr|ncurses_isendwin|' +
        'ncurses_keyok|ncurses_keypad|ncurses_killchar|ncurses_longname|ncurses_meta|ncurses_mouse_trafo|ncurses_mouseinterval|ncurses_mousemask|' +
        'ncurses_move|ncurses_move_panel|ncurses_mvaddch|ncurses_mvaddchnstr|ncurses_mvaddchstr|ncurses_mvaddnstr|ncurses_mvaddstr|ncurses_mvcur|' +
        'ncurses_mvdelch|ncurses_mvgetch|ncurses_mvhline|ncurses_mvinch|ncurses_mvvline|ncurses_mvwaddstr|ncurses_napms|ncurses_new_panel|' +
        'ncurses_newpad|ncurses_newwin|ncurses_nl|ncurses_nocbreak|ncurses_noecho|ncurses_nonl|ncurses_noqiflush|ncurses_noraw|' +
        'ncurses_pair_content|ncurses_panel_above|ncurses_panel_below|ncurses_panel_window|ncurses_pnoutrefresh|ncurses_prefresh|' +
        'ncurses_putp|ncurses_qiflush|ncurses_raw|ncurses_refresh|ncurses_replace_panel|ncurses_reset_prog_mode|ncurses_reset_shell_mode|' +
        'ncurses_resetty|ncurses_savetty|ncurses_scr_dump|ncurses_scr_init|ncurses_scr_restore|ncurses_scr_set|ncurses_scrl|ncurses_show_panel|' +
        'ncurses_slk_attr|ncurses_slk_attroff|ncurses_slk_attron|ncurses_slk_attrset|ncurses_slk_clear|ncurses_slk_color|ncurses_slk_init|' +
        'ncurses_slk_noutrefresh|ncurses_slk_refresh|ncurses_slk_restore|ncurses_slk_set|ncurses_slk_touch|ncurses_standend|ncurses_standout|' +
        'ncurses_start_color|ncurses_termattrs|ncurses_termname|ncurses_timeout|ncurses_top_panel|ncurses_typeahead|ncurses_ungetch|' +
        'ncurses_ungetmouse|ncurses_update_panels|ncurses_use_default_colors|ncurses_use_env|ncurses_use_extended_names|ncurses_vidattr|' +
        'ncurses_vline|ncurses_waddch|ncurses_waddstr|ncurses_wattroff|ncurses_wattron|ncurses_wattrset|ncurses_wborder|ncurses_wclear|' +
        'ncurses_wcolor_set|ncurses_werase|ncurses_wgetch|ncurses_whline|ncurses_wmouse_trafo|ncurses_wmove|ncurses_wnoutrefresh|' +
        'ncurses_wrefresh|ncurses_wstandend|ncurses_wstandout|ncurses_wvline|next|ngettext|nl2br|nl_langinfo|notes_body|notes_copy_db|' +
        'notes_create_db|notes_create_note|notes_drop_db|notes_find_note|notes_header_info|notes_list_msgs|notes_mark_read|notes_mark_unread|' +
        'notes_nav_create|notes_search|notes_unread|notes_version|nsapi_request_headers|nsapi_response_headers|nsapi_virtual|number_format|' +
        'ob_clean|ob_end_clean|ob_end_flush|ob_flush|ob_get_clean|ob_get_contents|ob_get_flush|ob_get_length|ob_get_level|ob_get_status|' +
        'ob_gzhandler|ob_iconv_handler|ob_implicit_flush|ob_list_handlers|ob_start|ob_tidyhandler|oci_bind_by_name|oci_cancel|oci_close|' +
        'oci_commit|oci_connect|oci_define_by_name|oci_error|oci_execute|oci_fetch|oci_fetch_all|oci_fetch_array|oci_fetch_assoc|' +
        'oci_fetch_object|oci_fetch_row|oci_field_is_null|oci_field_name|oci_field_precision|oci_field_scale|oci_field_size|oci_field_type|' +
        'oci_field_type_raw|oci_free_statement|oci_internal_debug|oci_lob_copy|oci_lob_is_equal|oci_new_collection|oci_new_connect|' +
        'oci_new_cursor|oci_new_descriptor|oci_num_fields|oci_num_rows|oci_parse|oci_password_change|oci_pconnect|oci_result|oci_rollback|' +
        'oci_server_version|oci_set_prefetch|oci_statement_type|ocibindbyname|ocicancel|ocicloselob|ocicollappend|ocicollassign|' +
        'ocicollassignelem|ocicollgetelem|ocicollmax|ocicollsize|ocicolltrim|ocicolumnisnull|ocicolumnname|ocicolumnprecision|ocicolumnscale|' +
        'ocicolumnsize|ocicolumntype|ocicolumntyperaw|ocicommit|ocidefinebyname|ocierror|ociexecute|ocifetch|ocifetchinto|ocifetchstatement|' +
        'ocifreecollection|ocifreecursor|ocifreedesc|ocifreestatement|ociinternaldebug|ociloadlob|ocilogoff|ocilogon|ocinewcollection|' +
        'ocinewcursor|ocinewdescriptor|ocinlogon|ocinumcols|ociparse|ociplogon|ociresult|ocirollback|ocirowcount|ocisavelob|ocisavelobfile|' +
        'ociserverversion|ocisetprefetch|ocistatementtype|ociwritelobtofile|ociwritetemporarylob|octdec|odbc_autocommit|odbc_binmode|' +
        'odbc_close|odbc_close_all|odbc_columnprivileges|odbc_columns|odbc_commit|odbc_connect|odbc_cursor|odbc_data_source|odbc_do|odbc_error|' +
        'odbc_errormsg|odbc_exec|odbc_execute|odbc_fetch_array|odbc_fetch_into|odbc_fetch_object|odbc_fetch_row|odbc_field_len|odbc_field_name|' +
        'odbc_field_num|odbc_field_precision|odbc_field_scale|odbc_field_type|odbc_foreignkeys|odbc_free_result|odbc_gettypeinfo|odbc_longreadlen|' +
        'odbc_next_result|odbc_num_fields|odbc_num_rows|odbc_pconnect|odbc_prepare|odbc_primarykeys|odbc_procedurecolumns|odbc_procedures|' +
        'odbc_result|odbc_result_all|odbc_rollback|odbc_setoption|odbc_specialcolumns|odbc_statistics|odbc_tableprivileges|odbc_tables|opendir|' +
        'openlog|openssl_csr_export|openssl_csr_export_to_file|openssl_csr_new|openssl_csr_sign|openssl_error_string|openssl_free_key|' +
        'openssl_get_privatekey|openssl_get_publickey|openssl_open|openssl_pkcs7_decrypt|openssl_pkcs7_encrypt|openssl_pkcs7_sign|' +
        'openssl_pkcs7_verify|openssl_pkey_export|openssl_pkey_export_to_file|openssl_pkey_get_private|openssl_pkey_get_public|openssl_pkey_new|' +
        'openssl_private_decrypt|openssl_private_encrypt|openssl_public_decrypt|openssl_public_encrypt|openssl_seal|openssl_sign|openssl_verify|' +
        'openssl_x509_check_private_key|openssl_x509_checkpurpose|openssl_x509_export|openssl_x509_export_to_file|openssl_x509_free|' +
        'openssl_x509_parse|openssl_x509_read|ora_bind|ora_close|ora_columnname|ora_columnsize|ora_columntype|ora_commit|ora_commitoff|' +
        'ora_commiton|ora_do|ora_error|ora_errorcode|ora_exec|ora_fetch|ora_fetch_into|ora_getcolumn|ora_logoff|ora_logon|ora_numcols|' +
        'ora_numrows|ora_open|ora_parse|ora_plogon|ora_rollback|ord|output_add_rewrite_var|output_reset_rewrite_vars|overload|ovrimos_close|' +
        'ovrimos_commit|ovrimos_connect|ovrimos_cursor|ovrimos_exec|ovrimos_execute|ovrimos_fetch_into|ovrimos_fetch_row|ovrimos_field_len|' +
        'ovrimos_field_name|ovrimos_field_num|ovrimos_field_type|ovrimos_free_result|ovrimos_longreadlen|ovrimos_num_fields|ovrimos_num_rows|' +
        'ovrimos_prepare|ovrimos_result|ovrimos_result_all|ovrimos_rollback|pack|parse_ini_file|parse_str|parse_url|passthru|pathinfo|pclose|' +
        'pcntl_alarm|pcntl_exec|pcntl_fork|pcntl_getpriority|pcntl_setpriority|pcntl_signal|pcntl_wait|pcntl_waitpid|pcntl_wexitstatus|' +
        'pcntl_wifexited|pcntl_wifsignaled|pcntl_wifstopped|pcntl_wstopsig|pcntl_wtermsig|pdf_add_annotation|pdf_add_bookmark|pdf_add_launchlink|' +
        'pdf_add_locallink|pdf_add_note|pdf_add_outline|pdf_add_pdflink|pdf_add_thumbnail|pdf_add_weblink|pdf_arc|pdf_arcn|pdf_attach_file|' +
        'pdf_begin_page|pdf_begin_pattern|pdf_begin_template|pdf_circle|pdf_clip|pdf_close|pdf_close_image|pdf_close_pdi|pdf_close_pdi_page|' +
        'pdf_closepath|pdf_closepath_fill_stroke|pdf_closepath_stroke|pdf_concat|pdf_continue_text|pdf_curveto|pdf_delete|pdf_end_page|' +
        'pdf_end_pattern|pdf_end_template|pdf_endpath|pdf_fill|pdf_fill_stroke|pdf_findfont|pdf_get_buffer|pdf_get_font|pdf_get_fontname|' +
        'pdf_get_fontsize|pdf_get_image_height|pdf_get_image_width|pdf_get_majorversion|pdf_get_minorversion|pdf_get_parameter|' +
        'pdf_get_pdi_parameter|pdf_get_pdi_value|pdf_get_value|pdf_initgraphics|pdf_lineto|pdf_makespotcolor|pdf_moveto|pdf_new|pdf_open|' +
        'pdf_open_ccitt|pdf_open_file|pdf_open_gif|pdf_open_image|pdf_open_image_file|pdf_open_jpeg|pdf_open_memory_image|pdf_open_pdi|' +
        'pdf_open_pdi_page|pdf_open_png|pdf_open_tiff|pdf_place_image|pdf_place_pdi_page|pdf_rect|pdf_restore|pdf_rotate|pdf_save|' +
        'pdf_scale|pdf_set_border_color|pdf_set_border_dash|pdf_set_border_style|pdf_set_char_spacing|pdf_set_duration|pdf_set_font|' +
        'pdf_set_horiz_scaling|pdf_set_info|pdf_set_info_author|pdf_set_info_creator|pdf_set_info_keywords|pdf_set_info_subject|' +
        'pdf_set_info_title|pdf_set_leading|pdf_set_parameter|pdf_set_text_matrix|pdf_set_text_pos|pdf_set_text_rendering|pdf_set_text_rise|' +
        'pdf_set_value|pdf_set_word_spacing|pdf_setcolor|pdf_setdash|pdf_setflat|pdf_setfont|pdf_setgray|pdf_setgray_fill|pdf_setgray_stroke|' +
        'pdf_setlinecap|pdf_setlinejoin|pdf_setlinewidth|pdf_setmatrix|pdf_setmiterlimit|pdf_setpolydash|pdf_setrgbcolor|pdf_setrgbcolor_fill|' +
        'pdf_setrgbcolor_stroke|pdf_show|pdf_show_boxed|pdf_show_xy|pdf_skew|pdf_stringwidth|pdf_stroke|pdf_translate|pfpro_cleanup|pfpro_init|' +
        'pfpro_process|pfpro_process_raw|pfpro_version|pfsockopen|pg_affected_rows|pg_cancel_query|pg_client_encoding|pg_close|pg_connect|' +
        'pg_connection_busy|pg_connection_reset|pg_connection_status|pg_convert|pg_copy_from|pg_copy_to|pg_dbname|pg_delete|pg_end_copy|' +
        'pg_escape_bytea|pg_escape_string|pg_fetch_all|pg_fetch_array|pg_fetch_assoc|pg_fetch_object|pg_fetch_result|pg_fetch_row|' +
        'pg_field_is_null|pg_field_name|pg_field_num|pg_field_prtlen|pg_field_size|pg_field_type|pg_free_result|pg_get_notify|pg_get_pid|' +
        'pg_get_result|pg_host|pg_insert|pg_last_error|pg_last_notice|pg_last_oid|pg_lo_close|pg_lo_create|pg_lo_export|pg_lo_import|' +
        'pg_lo_open|pg_lo_read|pg_lo_read_all|pg_lo_seek|pg_lo_tell|pg_lo_unlink|pg_lo_write|pg_meta_data|pg_num_fields|pg_num_rows|' +
        'pg_options|pg_pconnect|pg_ping|pg_port|pg_put_line|pg_query|pg_result_error|pg_result_seek|pg_result_status|pg_select|pg_send_query|' +
        'pg_set_client_encoding|pg_trace|pg_tty|pg_unescape_bytea|pg_untrace|pg_update|php_ini_scanned_files|php_logo_guid|php_sapi_name|' +
        'php_uname|phpcredits|phpinfo|phpversion|pi|png2wbmp|popen|pos|posix_ctermid|posix_get_last_error|posix_getcwd|posix_getegid|' +
        'posix_geteuid|posix_getgid|posix_getgrgid|posix_getgrnam|posix_getgroups|posix_getlogin|posix_getpgid|posix_getpgrp|posix_getpid|' +
        'posix_getppid|posix_getpwnam|posix_getpwuid|posix_getrlimit|posix_getsid|posix_getuid|posix_isatty|posix_kill|posix_mkfifo|' +
        'posix_setegid|posix_seteuid|posix_setgid|posix_setpgid|posix_setsid|posix_setuid|posix_strerror|posix_times|posix_ttyname|' +
        'posix_uname|pow|preg_grep|preg_match|preg_match_all|preg_quote|preg_replace|preg_replace_callback|preg_split|prev|print|print_r|' +
        'printer_abort|printer_close|printer_create_brush|printer_create_dc|printer_create_font|printer_create_pen|printer_delete_brush|' +
        'printer_delete_dc|printer_delete_font|printer_delete_pen|printer_draw_bmp|printer_draw_chord|printer_draw_elipse|printer_draw_line|' +
        'printer_draw_pie|printer_draw_rectangle|printer_draw_roundrect|printer_draw_text|printer_end_doc|printer_end_page|printer_get_option|' +
        'printer_list|printer_logical_fontheight|printer_open|printer_select_brush|printer_select_font|printer_select_pen|printer_set_option|' +
        'printer_start_doc|printer_start_page|printer_write|printf|proc_close|proc_get_status|proc_nice|proc_open|proc_terminate|' +
        'pspell_add_to_personal|pspell_add_to_session|pspell_check|pspell_clear_session|pspell_config_create|pspell_config_ignore|' +
        'pspell_config_mode|pspell_config_personal|pspell_config_repl|pspell_config_runtogether|pspell_config_save_repl|pspell_new|' +
        'pspell_new_config|pspell_new_personal|pspell_save_wordlist|pspell_store_replacement|pspell_suggest|putenv|qdom_error|qdom_tree|' +
        'quoted_printable_decode|quotemeta|rad2deg|rand|range|rawurldecode|rawurlencode|read_exif_data|readdir|readfile|readgzfile|readline|' +
        'readline_add_history|readline_clear_history|readline_completion_function|readline_info|readline_list_history|readline_read_history|' +
        'readline_write_history|readlink|realpath|recode|recode_file|recode_string|register_shutdown_function|register_tick_function|rename|' +
        'reset|restore_error_handler|restore_include_path|rewind|rewinddir|rmdir|round|rsort|rtrim|scandir|sem_acquire|sem_get|sem_release|' +
        'sem_remove|serialize|sesam_affected_rows|sesam_commit|sesam_connect|sesam_diagnostic|sesam_disconnect|sesam_errormsg|sesam_execimm|' +
        'sesam_fetch_array|sesam_fetch_result|sesam_fetch_row|sesam_field_array|sesam_field_name|sesam_free_result|sesam_num_fields|sesam_query|' +
        'sesam_rollback|sesam_seek_row|sesam_settransaction|session_cache_expire|session_cache_limiter|session_commit|session_decode|' +
        'session_destroy|session_encode|session_get_cookie_params|session_id|session_is_registered|session_module_name|session_name|' +
        'session_regenerate_id|session_register|session_save_path|session_set_cookie_params|session_set_save_handler|session_start|' +
        'session_unregister|session_unset|session_write_close|set_error_handler|set_file_buffer|set_include_path|set_magic_quotes_runtime|' +
        'set_time_limit|setcookie|setlocale|setrawcookie|settype|sha1|sha1_file|shell_exec|shm_attach|shm_detach|shm_get_var|shm_put_var|' +
        'shm_remove|shm_remove_var|shmop_close|shmop_delete|shmop_open|shmop_read|shmop_size|shmop_write|show_source|shuffle|similar_text|' +
        'simplexml_import_dom|simplexml_load_file|simplexml_load_string|sin|sinh|sizeof|sleep|snmp_get_quick_print|snmp_set_quick_print|' +
        'snmpget|snmprealwalk|snmpset|snmpwalk|snmpwalkoid|socket_accept|socket_bind|socket_clear_error|socket_close|socket_connect|' +
        'socket_create|socket_create_listen|socket_create_pair|socket_get_option|socket_get_status|socket_getpeername|socket_getsockname|' +
        'socket_iovec_add|socket_iovec_alloc|socket_iovec_delete|socket_iovec_fetch|socket_iovec_free|socket_iovec_set|socket_last_error|' +
        'socket_listen|socket_read|socket_readv|socket_recv|socket_recvfrom|socket_recvmsg|socket_select|socket_send|socket_sendmsg|' +
        'socket_sendto|socket_set_block|socket_set_blocking|socket_set_nonblock|socket_set_option|socket_set_timeout|socket_shutdown|' +
        'socket_strerror|socket_write|socket_writev|sort|soundex|split|spliti|sprintf|sql_regcase|sqlite_array_query|sqlite_busy_timeout|' +
        'sqlite_changes|sqlite_close|sqlite_column|sqlite_create_aggregate|sqlite_create_function|sqlite_current|sqlite_error_string|' +
        'sqlite_escape_string|sqlite_fetch_array|sqlite_fetch_single|sqlite_fetch_string|sqlite_field_name|sqlite_has_more|sqlite_last_error|' +
        'sqlite_last_insert_rowid|sqlite_libencoding|sqlite_libversion|sqlite_next|sqlite_num_fields|sqlite_num_rows|sqlite_open|sqlite_popen|' +
        'sqlite_query|sqlite_rewind|sqlite_seek|sqlite_udf_decode_binary|sqlite_udf_encode_binary|sqlite_unbuffered_query|sqrt|srand|sscanf|' +
        'stat|str_ireplace|str_pad|str_repeat|str_replace|str_rot13|str_shuffle|str_split|str_word_count|strcasecmp|strchr|strcmp|strcoll|' +
        'strcspn|stream_context_create|stream_context_get_options|stream_context_set_option|stream_context_set_params|stream_copy_to_stream|' +
        'stream_filter_append|stream_filter_prepend|stream_filter_register|stream_get_contents|stream_get_filters|stream_get_line|' +
        'stream_get_meta_data|stream_get_transports|stream_get_wrappers|stream_register_wrapper|stream_select|stream_set_blocking|' +
        'stream_set_timeout|stream_set_write_buffer|stream_socket_accept|stream_socket_client|stream_socket_get_name|stream_socket_recvfrom|' +
        'stream_socket_sendto|stream_socket_server|stream_wrapper_register|strftime|strip_tags|stripcslashes|stripos|stripslashes|stristr|' +
        'strlen|strnatcasecmp|strnatcmp|strncasecmp|strncmp|strpos|strrchr|strrev|strripos|strrpos|strspn|strstr|strtok|strtolower|strtotime|' +
        'strtoupper|strtr|strval|substr|substr_compare|substr_count|substr_replace|swf_actiongeturl|swf_actiongotoframe|swf_actiongotolabel|' +
        'swf_actionnextframe|swf_actionplay|swf_actionprevframe|swf_actionsettarget|swf_actionstop|swf_actiontogglequality|swf_actionwaitforframe|' +
        'swf_addbuttonrecord|swf_addcolor|swf_closefile|swf_definebitmap|swf_definefont|swf_defineline|swf_definepoly|swf_definerect|' +
        'swf_definetext|swf_endbutton|swf_enddoaction|swf_endshape|swf_endsymbol|swf_fontsize|swf_fontslant|swf_fonttracking|swf_getbitmapinfo|' +
        'swf_getfontinfo|swf_getframe|swf_labelframe|swf_lookat|swf_modifyobject|swf_mulcolor|swf_nextid|swf_oncondition|swf_openfile|swf_ortho|' +
        'swf_ortho2|swf_perspective|swf_placeobject|swf_polarview|swf_popmatrix|swf_posround|swf_pushmatrix|swf_removeobject|swf_rotate|' +
        'swf_scale|swf_setfont|swf_setframe|swf_shapearc|swf_shapecurveto|swf_shapecurveto3|swf_shapefillbitmapclip|swf_shapefillbitmaptile|' +
        'swf_shapefilloff|swf_shapefillsolid|swf_shapelinesolid|swf_shapelineto|swf_shapemoveto|swf_showframe|swf_startbutton|swf_startdoaction|' +
        'swf_startshape|swf_startsymbol|swf_textwidth|swf_translate|swf_viewport|swfaction|swfbitmap|swfbutton|swfbutton_keypress|' +
        'swfdisplayitem|swffill|swffont|swfgradient|swfmorph|swfmovie|swfshape|swfsprite|swftext|swftextfield|sybase_affected_rows|sybase_close|' +
        'sybase_connect|sybase_data_seek|sybase_deadlock_retry_count|sybase_fetch_array|sybase_fetch_assoc|sybase_fetch_field|sybase_fetch_object|' +
        'sybase_fetch_row|sybase_field_seek|sybase_free_result|sybase_get_last_message|sybase_min_client_severity|sybase_min_error_severity|' +
        'sybase_min_message_severity|sybase_min_server_severity|sybase_num_fields|sybase_num_rows|sybase_pconnect|sybase_query|sybase_result|' +
        'sybase_select_db|sybase_set_message_handler|sybase_unbuffered_query|symlink|syslog|system|tan|tanh|tcpwrap_check|tempnam|textdomain|' +
        'tidy_access_count|tidy_clean_repair|tidy_config_count|tidy_diagnose|tidy_error_count|tidy_get_body|tidy_get_config|tidy_get_error_buffer|' +
        'tidy_get_head|tidy_get_html|tidy_get_html_ver|tidy_get_output|tidy_get_release|tidy_get_root|tidy_get_status|tidy_getopt|tidy_is_xhtml|' +
        'tidy_is_xml|tidy_load_config|tidy_parse_file|tidy_parse_string|tidy_repair_file|tidy_repair_string|tidy_reset_config|tidy_save_config|' +
        'tidy_set_encoding|tidy_setopt|tidy_warning_count|time|tmpfile|token_get_all|token_name|touch|trigger_error|trim|uasort|ucfirst|ucwords|' +
        'udm_add_search_limit|udm_alloc_agent|udm_alloc_agent_array|udm_api_version|udm_cat_list|udm_cat_path|udm_check_charset|udm_check_stored|' +
        'udm_clear_search_limits|udm_close_stored|udm_crc32|udm_errno|udm_error|udm_find|udm_free_agent|udm_free_ispell_data|udm_free_res|' +
        'udm_get_doc_count|udm_get_res_field|udm_get_res_param|udm_hash32|udm_load_ispell_data|udm_open_stored|udm_set_agent_param|uksort|umask|' +
        'uniqid|unixtojd|unlink|unpack|unregister_tick_function|unserialize|unset|urldecode|urlencode|user_error|usleep|usort|utf8_decode|' +
        'utf8_encode|var_dump|var_export|variant|version_compare|virtual|vpopmail_add_alias_domain|vpopmail_add_alias_domain_ex|' +
        'vpopmail_add_domain|vpopmail_add_domain_ex|vpopmail_add_user|vpopmail_alias_add|vpopmail_alias_del|vpopmail_alias_del_domain|' +
        'vpopmail_alias_get|vpopmail_alias_get_all|vpopmail_auth_user|vpopmail_del_domain|vpopmail_del_domain_ex|vpopmail_del_user|' +
        'vpopmail_error|vpopmail_passwd|vpopmail_set_user_quota|vprintf|vsprintf|w32api_deftype|w32api_init_dtype|w32api_invoke_function|' +
        'w32api_register_function|w32api_set_call_method|wddx_add_vars|wddx_deserialize|wddx_packet_end|wddx_packet_start|wddx_serialize_value|' +
        'wddx_serialize_vars|wordwrap|xdiff_file_diff|xdiff_file_diff_binary|xdiff_file_merge3|xdiff_file_patch|xdiff_file_patch_binary|' +
        'xdiff_string_diff|xdiff_string_diff_binary|xdiff_string_merge3|xdiff_string_patch|xdiff_string_patch_binary|xml_error_string|' +
        'xml_get_current_byte_index|xml_get_current_column_number|xml_get_current_line_number|xml_get_error_code|xml_parse|xml_parse_into_struct|' +
        'xml_parser_create|xml_parser_create_ns|xml_parser_free|xml_parser_get_option|xml_parser_set_option|xml_set_character_data_handler|' +
        'xml_set_default_handler|xml_set_element_handler|xml_set_end_namespace_decl_handler|xml_set_external_entity_ref_handler|' +
        'xml_set_notation_decl_handler|xml_set_object|xml_set_processing_instruction_handler|xml_set_start_namespace_decl_handler|' +
        'xml_set_unparsed_entity_decl_handler|xmlrpc_decode|xmlrpc_decode_request|xmlrpc_encode|xmlrpc_encode_request|xmlrpc_get_type|' +
        'xmlrpc_parse_method_descriptions|xmlrpc_server_add_introspection_data|xmlrpc_server_call_method|xmlrpc_server_create|' +
        'xmlrpc_server_destroy|xmlrpc_server_register_introspection_callback|xmlrpc_server_register_method|xmlrpc_set_type|xpath_eval|' +
        'xpath_eval_expression|xpath_new_context|xptr_eval|xptr_new_context|xsl_xsltprocessor_get_parameter|xsl_xsltprocessor_has_exslt_support|' +
        'xsl_xsltprocessor_import_stylesheet|xsl_xsltprocessor_register_php_functions|xsl_xsltprocessor_remove_parameter|' +
        'xsl_xsltprocessor_set_parameter|xsl_xsltprocessor_transform_to_doc|xsl_xsltprocessor_transform_to_uri|xsl_xsltprocessor_transform_to_xml|' +
        'xslt_create|xslt_errno|xslt_error|xslt_free|xslt_process|xslt_set_base|xslt_set_encoding|xslt_set_error_handler|xslt_set_log|' +
        'xslt_set_sax_handler|xslt_set_sax_handlers|xslt_set_scheme_handler|xslt_set_scheme_handlers|yaz_addinfo|yaz_ccl_conf|yaz_ccl_parse|' +
        'yaz_close|yaz_connect|yaz_database|yaz_element|yaz_errno|yaz_error|yaz_es_result|yaz_get_option|yaz_hits|yaz_itemorder|yaz_present|' +
        'yaz_range|yaz_record|yaz_scan|yaz_scan_result|yaz_schema|yaz_search|yaz_set_option|yaz_sort|yaz_syntax|yaz_wait|yp_all|yp_cat|' +
        'yp_err_string|yp_errno|yp_first|yp_get_default_domain|yp_master|yp_match|yp_next|yp_order|zend_logo_guid|zend_version|zip_close|' +
        'zip_entry_close|zip_entry_compressedsize|zip_entry_compressionmethod|zip_entry_filesize|zip_entry_name|zip_entry_open|zip_entry_read|' +
        'zip_open|zip_read|zlib_get_coding_type').split('|')
	);
	
    var keywords = lang.arrayToMap(
        ('abstract|and|array|as|break|case|catch|cfunction|class|clone|const|continue|declare|default|die|do|' +
        'else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|final|for|foreach|function|' +
        'include|include_once|global|goto|if|implements|interface|instanceof|namespace|new|old_function|or|' +
        'private|protected|public|return|require|require_once|static|switch|throw|try|use|var|while|xor').split('|')
    );
    
    var builtinConstants = lang.arrayToMap(
        ('true|false|null|__FILE__|__LINE__|__METHOD__|__FUNCTION__|__CLASS__').split('|')
    );
    
    var builtinVariables = lang.arrayToMap(
        ('$_GLOBALS|$_SERVER|$_GET|$_POST|$_FILES|$_REQUEST|$_SESSION|$_ENV|$_COOKIE|$php_errormsg|$HTTP_RAW_POST_DATA|' +
        '$http_response_header|$argc|$argv').split('|')
    );
    
    var futureReserved = lang.arrayToMap([]);
    
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [
            {
                token : "support", // php open tag
                regex : "<\\?(?:php|\\=)"
            },
            {
                token : "support", // php close tag
                regex : "\\?>"
            },
            {
                token : "comment",
                regex : "\\/\\/.*$"
            },
            docComment.getStartRule("doc-start"),
            {
                token : "comment", // multi line comment
                regex : "\\/\\*",
                next : "comment"
            }, {
                token : "string.regexp",
                regex : "[/](?:(?:\\[(?:\\\\]|[^\\]])+\\])|(?:\\\\/|[^\\]/]))*[/][gimy]*\\s*(?=[).,;]|$)"
            }, {
                token : "string", // single line
                regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
            }, {
                token : "string", // multi line string start
                regex : '["].*\\\\$',
                next : "qqstring"
            }, {
                token : "string", // single line
                regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
            }, {
                token : "string", // multi line string start
                regex : "['].*\\\\$",
                next : "qstring"
            }, {
                token : "constant.numeric", // hex
                regex : "0[xX][0-9a-fA-F]+\\b"
            }, {
                token : "constant.numeric", // float
                regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
            }, {
                token : "constant.language", // constants
                regex : "\\b(?:DEFAULT_INCLUDE_PATH|E_(?:ALL|CO(?:MPILE_(?:ERROR|WARNING)|RE_(?:ERROR|WARNING))|" +
                        "ERROR|NOTICE|PARSE|STRICT|USER_(?:ERROR|NOTICE|WARNING)|WARNING)|P(?:EAR_(?:EXTENSION_DIR|INSTALL_DIR)|" + 
                        "HP_(?:BINDIR|CONFIG_FILE_(?:PATH|SCAN_DIR)|DATADIR|E(?:OL|XTENSION_DIR)|INT_(?:MAX|SIZE)|" + 
                        "L(?:IBDIR|OCALSTATEDIR)|O(?:S|UTPUT_HANDLER_(?:CONT|END|START))|PREFIX|S(?:API|HLIB_SUFFIX|YSCONFDIR)|" +
                        "VERSION))|__COMPILER_HALT_OFFSET__)\\b"
            }, {
                token : "constant.language", // constants
                regex : "\\b(?:A(?:B(?:DAY_(?:1|2|3|4|5|6|7)|MON_(?:1(?:0|1|2|)|2|3|4|5|6|7|8|9))|LT_DIGITS|M_STR|" + 
                        "SSERT_(?:ACTIVE|BAIL|CALLBACK|QUIET_EVAL|WARNING))|C(?:ASE_(?:LOWER|UPPER)|HAR_MAX|" +
                        "O(?:DESET|NNECTION_(?:ABORTED|NORMAL|TIMEOUT)|UNT_(?:NORMAL|RECURSIVE))|" +
                        "R(?:EDITS_(?:ALL|DOCS|FULLPAGE|G(?:ENERAL|ROUP)|MODULES|QA|SAPI)|NCYSTR|" +
                        "YPT_(?:BLOWFISH|EXT_DES|MD5|S(?:ALT_LENGTH|TD_DES)))|URRENCY_SYMBOL)|D(?:AY_(?:1|2|3|4|5|6|7)|" +
                        "ECIMAL_POINT|IRECTORY_SEPARATOR|_(?:FMT|T_FMT))|E(?:NT_(?:COMPAT|NOQUOTES|QUOTES)|RA(?:_(?:D_(?:FMT|T_FMT)|" +
                        "T_FMT|YEAR)|)|XTR_(?:IF_EXISTS|OVERWRITE|PREFIX_(?:ALL|I(?:F_EXISTS|NVALID)|SAME)|SKIP))|FRAC_DIGITS|GROUPING|" +
                        "HTML_(?:ENTITIES|SPECIALCHARS)|IN(?:FO_(?:ALL|C(?:ONFIGURATION|REDITS)|ENVIRONMENT|GENERAL|LICENSE|MODULES|VARIABLES)|" +
                        "I_(?:ALL|PERDIR|SYSTEM|USER)|T_(?:CURR_SYMBOL|FRAC_DIGITS))|L(?:C_(?:ALL|C(?:OLLATE|TYPE)|M(?:ESSAGES|ONETARY)|NUMERIC|TIME)|" +
                        "O(?:CK_(?:EX|NB|SH|UN)|G_(?:A(?:LERT|UTH(?:PRIV|))|C(?:ONS|R(?:IT|ON))|D(?:AEMON|EBUG)|E(?:MERG|RR)|INFO|KERN|" +
                        "L(?:OCAL(?:0|1|2|3|4|5|6|7)|PR)|MAIL|N(?:DELAY|EWS|O(?:TICE|WAIT))|ODELAY|P(?:ERROR|ID)|SYSLOG|U(?:SER|UCP)|WARNING)))|" +
                        "M(?:ON_(?:1(?:0|1|2|)|2|3|4|5|6|7|8|9|DECIMAL_POINT|GROUPING|THOUSANDS_SEP)|_(?:1_PI|2_(?:PI|SQRTPI)|E|L(?:N(?:10|2)|" +
                        "OG(?:10E|2E))|PI(?:_(?:2|4)|)|SQRT(?:1_2|2)))|N(?:EGATIVE_SIGN|O(?:EXPR|STR)|_(?:CS_PRECEDES|S(?:EP_BY_SPACE|IGN_POSN)))|" +
                        "P(?:ATH(?:INFO_(?:BASENAME|DIRNAME|EXTENSION)|_SEPARATOR)|M_STR|OSITIVE_SIGN|_(?:CS_PRECEDES|S(?:EP_BY_SPACE|IGN_POSN)))|" +
                        "RADIXCHAR|S(?:EEK_(?:CUR|END|SET)|ORT_(?:ASC|DESC|NUMERIC|REGULAR|STRING)|TR_PAD_(?:BOTH|LEFT|RIGHT))|" +
                        "T(?:HOUS(?:ANDS_SEP|EP)|_FMT(?:_AMPM|))|YES(?:EXPR|STR)|STD(?:IN|OUT|ERR))\\b"
            }, {
                token : function(value) {
                    if (keywords[value])
                        return "keyword";
                    else if (builtinConstants[value])
                        return "constant.language";
                    else if (builtinVariables[value])
                        return "variable.language";
                    else if (futureReserved[value])
                        return "invalid.illegal";
                    else if (builtinFunctions[value])
                        return "support.function";
                    else if (value == "debugger")
                        return "invalid.deprecated";
                    else
                        if(value.match(/^(\$[a-zA-Z][a-zA-Z0-9_]*|self|parent)$/))
                            return "variable";
                        return "identifier";
                },
                // TODO: Unicode escape sequences
                // TODO: Unicode identifiers
                regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
            }, {
                token : "keyword.operator",
                regex : "!|\\$|%|&|\\*|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?\\:|\\*=|%=|\\+=|\\-=|&=|\\^=|\\b(?:in|instanceof|new|delete|typeof|void)"
            }, {
                token : "lparen",
                regex : "[[({]"
            }, {
                token : "rparen",
                regex : "[\\])}]"
            }, {
                token : "text",
                regex : "\\s+"
            }
        ],
        "comment" : [
            {
                token : "comment", // closing comment
                regex : ".*?\\*\\/",
                next : "start"
            }, {
                token : "comment", // comment spanning whole line
                regex : ".+"
            }
        ],
        "qqstring" : [
            {
                token : "string",
                regex : '(?:(?:\\\\.)|(?:[^"\\\\]))*?"',
                next : "start"
            }, {
                token : "string",
                regex : '.+'
            }
        ],
        "qstring" : [
            {
                token : "string",
                regex : "(?:(?:\\\\.)|(?:[^'\\\\]))*?'",
                next : "start"
            }, {
                token : "string",
                regex : '.+'
            }
        ]
    };

    this.addRules(docComment.getRules(), "doc-");
    this.$rules["doc-start"][0].next = "start";
};

oop.inherits(PhpHighlightRules, TextHighlightRules);

exports.PhpHighlightRules = PhpHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/matching_brace_outdent', function(require, exports, module) {

var Range = require("ace/range").Range;

var MatchingBraceOutdent = function() {};

(function() {

    this.checkOutdent = function(line, input) {
        if (! /^\s+$/.test(line))
            return false;

        return /^\s*\}/.test(input);
    };

    this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);

        return indent.length - (column-1);
    };

    this.$getIndent = function(line) {
        var match = line.match(/^(\s+)/);
        if (match) {
            return match[1];
        }

        return "";
    };

}).call(MatchingBraceOutdent.prototype);

exports.MatchingBraceOutdent = MatchingBraceOutdent;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/css_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var CssHighlightRules = function() {

    var properties = lang.arrayToMap(
        ("azimuth|background-attachment|background-color|background-image|" +
        "background-position|background-repeat|background|border-bottom-color|" +
        "border-bottom-style|border-bottom-width|border-bottom|border-collapse|" +
        "border-color|border-left-color|border-left-style|border-left-width|" +
        "border-left|border-right-color|border-right-style|border-right-width|" +
        "border-right|border-spacing|border-style|border-top-color|" +
        "border-top-style|border-top-width|border-top|border-width|border|" +
        "bottom|caption-side|clear|clip|color|content|counter-increment|" +
        "counter-reset|cue-after|cue-before|cue|cursor|direction|display|" +
        "elevation|empty-cells|float|font-family|font-size-adjust|font-size|" +
        "font-stretch|font-style|font-variant|font-weight|font|height|left|" +
        "letter-spacing|line-height|list-style-image|list-style-position|" +
        "list-style-type|list-style|margin-bottom|margin-left|margin-right|" +
        "margin-top|marker-offset|margin|marks|max-height|max-width|min-height|" +
        "min-width|-moz-border-radius|opacity|orphans|outline-color|" +
        "outline-style|outline-width|outline|overflow|overflow-x|overflow-y|padding-bottom|" +
        "padding-left|padding-right|padding-top|padding|page-break-after|" +
        "page-break-before|page-break-inside|page|pause-after|pause-before|" +
        "pause|pitch-range|pitch|play-during|position|quotes|richness|right|" +
        "size|speak-header|speak-numeral|speak-punctuation|speech-rate|speak|" +
        "stress|table-layout|text-align|text-decoration|text-indent|" +
        "text-shadow|text-transform|top|unicode-bidi|vertical-align|" +
        "visibility|voice-family|volume|white-space|widows|width|word-spacing|" +
        "z-index").split("|")
    );

    var functions = lang.arrayToMap(
        ("rgb|rgba|url|attr|counter|counters").split("|")
    );

    var constants = lang.arrayToMap(
        ("absolute|all-scroll|always|armenian|auto|baseline|below|bidi-override|" +
        "block|bold|bolder|both|bottom|break-all|break-word|capitalize|center|" +
        "char|circle|cjk-ideographic|col-resize|collapse|crosshair|dashed|" +
        "decimal-leading-zero|decimal|default|disabled|disc|" +
        "distribute-all-lines|distribute-letter|distribute-space|" +
        "distribute|dotted|double|e-resize|ellipsis|fixed|georgian|groove|" +
        "hand|hebrew|help|hidden|hiragana-iroha|hiragana|horizontal|" +
        "ideograph-alpha|ideograph-numeric|ideograph-parenthesis|" +
        "ideograph-space|inactive|inherit|inline-block|inline|inset|inside|" +
        "inter-ideograph|inter-word|italic|justify|katakana-iroha|katakana|" +
        "keep-all|left|lighter|line-edge|line-through|line|list-item|loose|" +
        "lower-alpha|lower-greek|lower-latin|lower-roman|lowercase|lr-tb|ltr|" +
        "medium|middle|move|n-resize|ne-resize|newspaper|no-drop|no-repeat|" +
        "nw-resize|none|normal|not-allowed|nowrap|oblique|outset|outside|" +
        "overline|pointer|progress|relative|repeat-x|repeat-y|repeat|right|" +
        "ridge|row-resize|rtl|s-resize|scroll|se-resize|separate|small-caps|" +
        "solid|square|static|strict|super|sw-resize|table-footer-group|" +
        "table-header-group|tb-rl|text-bottom|text-top|text|thick|thin|top|" +
        "transparent|underline|upper-alpha|upper-latin|upper-roman|uppercase|" +
        "vertical-ideographic|vertical-text|visible|w-resize|wait|whitespace|" +
        "zero").split("|")
    );
    
    var colors = lang.arrayToMap(
        ("aqua|black|blue|fuchsia|gray|green|lime|maroon|navy|olive|orange|" +
        "purple|red|silver|teal|white|yellow").split("|")
    );

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    var numRe = "\\-?(?:(?:[0-9]+)|(?:[0-9]*\\.[0-9]+))";

    function ic(str) {
        var re = [];
        var chars = str.split("");
        for (var i=0; i<chars.length; i++) {
            re.push(
                "[",
                chars[i].toLowerCase(),
                chars[i].toUpperCase(),
                "]"
            );
        }
        return re.join("");
    }

    this.$rules = {
        "start" : [ {
            token : "comment", // multi line comment
            regex : "\\/\\*",
            next : "comment"
        }, {
            token : "string", // single line
            regex : '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
        }, {
            token : "string", // single line
            regex : "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
        }, {
            token : "constant.numeric",
            regex : numRe + ic("em")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("ex")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("px")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("cm")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("mm")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("in")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("pt")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("pc")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("deg")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("rad")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("grad")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("ms")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("s")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("hz")
        }, {
            token : "constant.numeric",
            regex : numRe + ic("khz")
        }, {
            token : "constant.numeric",
            regex : numRe + "%"
        }, {
            token : "constant.numeric",
            regex : numRe
        }, {
            token : "constant.numeric",  // hex6 color
            regex : "#[a-fA-F0-9]{6}"
        }, {
            token : "constant.numeric", // hex3 color
            regex : "#[a-fA-F0-9]{3}"
        }, {
            token : "lparen",
            regex : "\{"
        }, {
            token : "rparen",
            regex : "\}"
        }, {
            token : function(value) {
                if (properties[value.toLowerCase()]) {
                    return "support.type";
                }
                else if (functions[value.toLowerCase()]) {
                    return "support.function";
                }
                else if (constants[value.toLowerCase()]) {
                    return "support.constant";
                }
                else if (colors[value.toLowerCase()]) {
                    return "support.constant.color";
                }
                else {
                    return "text";
                }
            },
            regex : "\\-?[a-zA-Z_][a-zA-Z0-9_\\-]*"
        }],
        "comment" : [{
            token : "comment", // closing comment
            regex : ".*?\\*\\/",
            next : "start"
        }, {
            token : "comment", // comment spanning whole line
            regex : ".+"
        }]
    };
};

oop.inherits(CssHighlightRules, TextHighlightRules);

exports.CssHighlightRules = CssHighlightRules;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/xml_highlight_rules', function(require, exports, module) {

var oop = require("pilot/oop");
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var XmlHighlightRules = function() {

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used

    this.$rules = {
        start : [ {
            token : "text",
            regex : "<\\!\\[CDATA\\[",
            next : "cdata"
        }, {
            token : "xml_pe",
            regex : "<\\?.*?\\?>"
        }, {
            token : "comment",
            regex : "<\\!--",
            next : "comment"
        }, {
            token : "text", // opening tag
            regex : "<\\/?",
            next : "tag"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "text",
            regex : "[^<]+"
        } ],

        tag : [ {
            token : "text",
            regex : ">",
            next : "start"
        }, {
            token : "keyword",
            regex : "[-_a-zA-Z0-9:]+"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "string",
            regex : '".*?"'
        }, {
            token : "string",
            regex : "'.*?'"
        } ],

        cdata : [ {
            token : "text",
            regex : "\\]\\]>",
            next : "start"
        }, {
            token : "text",
            regex : "\\s+"
        }, {
            token : "text",
            regex : "(?:[^\\]]|\\](?!\\]>))+"
        } ],

        comment : [ {
            token : "comment",
            regex : ".*?-->",
            next : "start"
        }, {
            token : "comment",
            regex : ".+"
        } ]
    };
};

/fd/g

oop.inherits(XmlHighlightRules, TextHighlightRules);

exports.XmlHighlightRules = XmlHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Ajax.org Code Editor (ACE).
*
* The Initial Developer of the Original Code is
* Ajax.org B.V.
* Portions created by the Initial Developer are Copyright (C) 2010
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*      André Fiedler <fiedler dot andre a t gmail dot com>
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */

define('ace/mode/php', function(require, exports, module) {

var oop = require("pilot/oop");
var TextMode = require("ace/mode/text").Mode;
var Tokenizer = require("ace/tokenizer").Tokenizer;
var PhpHighlightRules = require("ace/mode/php_highlight_rules").PhpHighlightRules;
var MatchingBraceOutdent = require("ace/mode/matching_brace_outdent").MatchingBraceOutdent;
var Range = require("ace/range").Range;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new PhpHighlightRules().getRules());
    this.$outdent = new MatchingBraceOutdent();
};
oop.inherits(Mode, TextMode);

(function() {

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        var outdent = true;
        var outentedRows = [];
        var re = /^(\s*)#/;

        for (var i=startRow; i<= endRow; i++) {
            if (!re.test(doc.getLine(i))) {
                outdent = false;
                break;
            }
        }

        if (outdent) {
            var deleteRange = new Range(0, 0, 0, 0);
            for (var i=startRow; i<= endRow; i++)
            {
                var line = doc.getLine(i).replace(re, "$1");
                deleteRange.start.row = i;
                deleteRange.end.row = i;
                deleteRange.end.column = line.length + 2;
                doc.replace(deleteRange, line);
            }
            return -2;
        }
        else {
            return doc.indentRows(startRow, endRow, "#");
        }
    };

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.$tokenizer.getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;
        var endState = tokenizedLine.state;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        if (state == "start") {
            var match = line.match(/^.*[\{\(\[\:]\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        return this.$outdent.autoOutdent(doc, row);
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/text', function(require, exports, module) {

var Tokenizer = require("ace/tokenizer").Tokenizer;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new TextHighlightRules().getRules());
};

(function() {

    this.getTokenizer = function() {
        return this.$tokenizer;
    };

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
        return 0;
    };

    this.getNextLineIndent = function(state, line, tab) {
        return "";
    };

    this.checkOutdent = function(state, line, input) {
        return false;
    };

    this.autoOutdent = function(state, doc, row) {
    };

    this.$getIndent = function(line) {
        var match = line.match(/^(\s+)/);
        if (match) {
            return match[1];
        }

        return "";
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/selection', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var Range = require("ace/range").Range;

var Selection = function(doc) {
    this.doc = doc;

    this.clearSelection();
    this.selectionLead = {
        row: 0,
        column: 0
    };
};

(function() {

    oop.implement(this, EventEmitter);

    this.isEmpty = function() {
        return (!this.selectionAnchor ||
            (this.selectionAnchor.row == this.selectionLead.row &&
             this.selectionAnchor.column == this.selectionLead.column));
    };

    this.isMultiLine = function() {
        if (this.isEmpty()) {
            return false;
        }

        return this.getRange().isMultiLine();
    };

    this.getCursor = function() {
        return this.selectionLead;
    };

    this.setSelectionAnchor = function(row, column) {
        var anchor = this.$clipPositionToDocument(row, column);

        if (!this.selectionAnchor) {
            this.selectionAnchor = anchor;
            this._dispatchEvent("changeSelection", {});
        }
        else if (this.selectionAnchor.row !== anchor.row || this.selectionAnchor.column !== anchor.column) {
            this.selectionAnchor = anchor;
            this._dispatchEvent("changeSelection", {});
        }

    };

    this.getSelectionAnchor = function() {
        if (this.selectionAnchor) {
            return this.$clone(this.selectionAnchor);
        } else {
            return this.$clone(this.selectionLead);
        }
    };

    this.getSelectionLead = function() {
        return this.$clone(this.selectionLead);
    };

    this.shiftSelection = function(columns) {
        if (this.isEmpty()) {
            this.moveCursorTo(this.selectionLead.row, this.selectionLead.column + columns);
            return;
        };

        var anchor = this.getSelectionAnchor();
        var lead = this.getSelectionLead();

        var isBackwards = this.isBackwards();

        if (!isBackwards || anchor.column !== 0)
            this.setSelectionAnchor(anchor.row, anchor.column + columns);

        if (isBackwards || lead.column !== 0) {
            this.$moveSelection(function() {
                this.moveCursorTo(lead.row, lead.column + columns);
            });
        }
    };

    this.isBackwards = function() {
        var anchor = this.selectionAnchor || this.selectionLead;
        var lead = this.selectionLead;
        return (anchor.row > lead.row || (anchor.row == lead.row && anchor.column > lead.column));
    };

    this.getRange = function() {
        var anchor = this.selectionAnchor || this.selectionLead;
        var lead = this.selectionLead;

        if (this.isBackwards()) {
            return Range.fromPoints(lead, anchor);
        }
        else {
            return Range.fromPoints(anchor, lead);
        }
    };

    this.clearSelection = function() {
        if (this.selectionAnchor) {
            this.selectionAnchor = null;
            this._dispatchEvent("changeSelection", {});
        }
    };

    this.selectAll = function() {
        var lastRow = this.doc.getLength() - 1;
        this.setSelectionAnchor(lastRow, this.doc.getLine(lastRow).length);

        if (!this.selectionAnchor) {
            this.selectionAnchor = this.$clone(this.selectionLead);
        }

        var cursor = {row:0, column:0};
        // only dispatch change if the cursor actually changed
        if (cursor.row !== this.selectionLead.row || cursor.column !== this.selectionLead.column) {
            this.selectionLead = cursor;
            this._dispatchEvent("changeSelection", {blockScrolling: true});
        }
    };

    this.setSelectionRange = function(range, reverse) {
        if (reverse) {
            this.setSelectionAnchor(range.end.row, range.end.column);
            this.selectTo(range.start.row, range.start.column);            
        } else {
            this.setSelectionAnchor(range.start.row, range.start.column);
            this.selectTo(range.end.row, range.end.column);
        }
    };

    this.$moveSelection = function(mover) {
        var changed = false;

        if (!this.selectionAnchor) {
            changed = true;
            this.selectionAnchor = this.$clone(this.selectionLead);
        }

        var cursor = this.$clone(this.selectionLead);
        mover.call(this);

        if (cursor.row !== this.selectionLead.row || cursor.column !== this.selectionLead.column) {
            changed = true;
        }

        if (changed)
            this._dispatchEvent("changeSelection", {});
    };

    this.selectTo = function(row, column) {
        this.$moveSelection(function() {
            this.moveCursorTo(row, column);
        });
    };

    this.selectToPosition = function(pos) {
        this.$moveSelection(function() {
            this.moveCursorToPosition(pos);
        });
    };

    this.selectUp = function() {
        this.$moveSelection(this.moveCursorUp);
    };

    this.selectDown = function() {
        this.$moveSelection(this.moveCursorDown);
    };

    this.selectRight = function() {
        this.$moveSelection(this.moveCursorRight);
    };

    this.selectLeft = function() {
        this.$moveSelection(this.moveCursorLeft);
    };

    this.selectLineStart = function() {
        this.$moveSelection(this.moveCursorLineStart);
    };

    this.selectLineEnd = function() {
        this.$moveSelection(this.moveCursorLineEnd);
    };

    this.selectFileEnd = function() {
        this.$moveSelection(this.moveCursorFileEnd);
    };

    this.selectFileStart = function() {
        this.$moveSelection(this.moveCursorFileStart);
    };

    this.selectWordRight = function() {
        this.$moveSelection(this.moveCursorWordRight);
    };

    this.selectWordLeft = function() {
        this.$moveSelection(this.moveCursorWordLeft);
    };

    this.selectWord = function() {
        var cursor = this.selectionLead;
        var column = cursor.column;
        var range  = this.doc.getWordRange(cursor.row, column);
        this.setSelectionRange(range);
        
        /*this.setSelectionAnchor(cursor.row, start);
        this.$moveSelection(function() {
            this.moveCursorTo(cursor.row, end);
        });*/
    };

    this.selectLine = function() {
        this.setSelectionAnchor(this.selectionLead.row, 0);
        this.$moveSelection(function() {
            this.moveCursorTo(this.selectionLead.row + 1, 0);
        });
    };

    this.moveCursorUp = function() {
        this.moveCursorBy(-1, 0);
    };

    this.moveCursorDown = function() {
        this.moveCursorBy(1, 0);
    };

    this.moveCursorLeft = function() {
        if (this.selectionLead.column == 0) {
            // cursor is a line start
            if (this.selectionLead.row > 0) {
                this.moveCursorTo(this.selectionLead.row - 1, this.doc
                        .getLine(this.selectionLead.row - 1).length);
            }
        }
        else {
            var doc = this.doc;
            var tabSize = doc.getTabSize();
            var cursor = this.selectionLead;
            if (doc.isTabStop(cursor) && doc.getLine(cursor.row).slice(cursor.column-tabSize, cursor.column).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, -tabSize);
            else
                this.moveCursorBy(0, -1);
        }
    };

    this.moveCursorRight = function() {
        if (this.selectionLead.column == this.doc.getLine(this.selectionLead.row).length) {
            if (this.selectionLead.row < this.doc.getLength() - 1) {
                this.moveCursorTo(this.selectionLead.row + 1, 0);
            }
        }
        else {
            var doc = this.doc;
            var tabSize = doc.getTabSize();
            var cursor = this.selectionLead;
            if (doc.isTabStop(cursor) && doc.getLine(cursor.row).slice(cursor.column, cursor.column+tabSize).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, tabSize);
            else
                this.moveCursorBy(0, 1);
        }
    };

    this.moveCursorLineStart = function() {
        var row = this.selectionLead.row;
        var column = this.selectionLead.column;
        var beforeCursor = this.doc.getLine(row).slice(0, column);
        var leadingSpace = beforeCursor.match(/^\s*/);
        if (leadingSpace[0].length == 0)
            this.moveCursorTo(row, this.doc.getLine(row).match(/^\s*/)[0].length);
        else if (leadingSpace[0].length >= column)
            this.moveCursorTo(row, 0);
        else
            this.moveCursorTo(row, leadingSpace[0].length); 
    };

    this.moveCursorLineEnd = function() {
        this.moveCursorTo(this.selectionLead.row,
                          this.doc.getLine(this.selectionLead.row).length);
    };

    this.moveCursorFileEnd = function() {
        var row = this.doc.getLength() - 1;
        var column = this.doc.getLine(row).length;
        this.moveCursorTo(row, column);
    };

    this.moveCursorFileStart = function() {
        this.moveCursorTo(0, 0);
    };

    this.moveCursorWordRight = function() {
        var row = this.selectionLead.row;
        var column = this.selectionLead.column;
        var line = this.doc.getLine(row);
        var rightOfCursor = line.substring(column);

        var match;
        this.doc.nonTokenRe.lastIndex = 0;
        this.doc.tokenRe.lastIndex = 0;

        if (column == line.length) {
            this.moveCursorRight();
            return;
        }
        else if (match = this.doc.nonTokenRe.exec(rightOfCursor)) {
            column += this.doc.nonTokenRe.lastIndex;
            this.doc.nonTokenRe.lastIndex = 0;
        }
        else if (match = this.doc.tokenRe.exec(rightOfCursor)) {
            column += this.doc.tokenRe.lastIndex;
            this.doc.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };

    this.moveCursorWordLeft = function() {
        var row = this.selectionLead.row;
        var column = this.selectionLead.column;
        var line = this.doc.getLine(row);
        var leftOfCursor = lang.stringReverse(line.substring(0, column));

        var match;
        this.doc.nonTokenRe.lastIndex = 0;
        this.doc.tokenRe.lastIndex = 0;

        if (column == 0) {
            this.moveCursorLeft();
            return;
        }
        else if (match = this.doc.nonTokenRe.exec(leftOfCursor)) {
            column -= this.doc.nonTokenRe.lastIndex;
            this.doc.nonTokenRe.lastIndex = 0;
        }
        else if (match = this.doc.tokenRe.exec(leftOfCursor)) {
            column -= this.doc.tokenRe.lastIndex;
            this.doc.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };

    this.moveCursorBy = function(rows, chars) {
        this.moveCursorTo(this.selectionLead.row + rows, this.selectionLead.column + chars);
    };


    this.moveCursorToPosition = function(position) {
        this.moveCursorTo(position.row, position.column);
    };

    this.moveCursorTo = function(row, column) {
        var cursor = this.$clipPositionToDocument(row, column);

        // only dispatch change if the cursor actually changed
        if (cursor.row !== this.selectionLead.row || cursor.column !== this.selectionLead.column) {
            this.selectionLead = cursor;
            this._dispatchEvent("changeCursor", { data: this.getCursor() });
        }
    };

    this.moveCursorUp = function() {
        this.moveCursorBy(-1, 0);
    };

    this.$clipPositionToDocument = function(row, column) {
        var pos = {};

        if (row >= this.doc.getLength()) {
            pos.row = Math.max(0, this.doc.getLength() - 1);
            pos.column = this.doc.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.doc.getLine(pos.row).length,
                    Math.max(0, column));
        }
        return pos;
    };

    this.$clone = function(pos) {
        return {
            row: pos.row,
            column: pos.column
        };
    };

}).call(Selection.prototype);

exports.Selection = Selection;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/scrollbar', function(require, exports, module) {

var oop = require("pilot/oop");
var dom = require("pilot/dom");
var event = require("pilot/event");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var ScrollBar = function(parent) {
    this.element = document.createElement("div");
    this.element.className = "ace_sb";

    this.inner = document.createElement("div");
    this.element.appendChild(this.inner);

    parent.appendChild(this.element);

    this.width = dom.scrollbarWidth();
    this.element.style.width = this.width;

    event.addListener(this.element, "scroll", this.onScroll.bind(this));
};

(function() {
    oop.implement(this, EventEmitter);

    this.onScroll = function() {
        this._dispatchEvent("scroll", {data: this.element.scrollTop});
    };

    this.getWidth = function() {
        return this.width;
    };

    this.setHeight = function(height) {
        this.element.style.height = Math.max(0, height - this.width) + "px";
    };

    this.setInnerHeight = function(height) {
        this.inner.style.height = height + "px";
    };

    this.setScrollTop = function(scrollTop) {
        this.element.scrollTop = scrollTop;
    };

}).call(ScrollBar.prototype);

exports.ScrollBar = ScrollBar;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/editor', function(require, exports, module) {

var oop = require("pilot/oop");
var event = require("pilot/event");
var lang = require("pilot/lang");
var TextInput = require("ace/keyboard/textinput").TextInput;
var KeyBinding = require("ace/keyboard/keybinding").KeyBinding;
var EditSession = require("ace/edit_session").EditSession;
var Search = require("ace/search").Search;
var BackgroundTokenizer = require("ace/background_tokenizer").BackgroundTokenizer;
var Range = require("ace/range").Range;
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var Editor =function(renderer, session) {
    var container = renderer.getContainerElement();
    this.container = container;
    this.renderer = renderer;

    this.textInput  = new TextInput(container, this);
    this.keyBinding = new KeyBinding(this);
    var self = this;
    event.addListener(container, "mousedown", function(e) {
        setTimeout(function() {self.focus();});
        return event.preventDefault(e);
    });
    event.addListener(container, "selectstart", function(e) {
        return event.preventDefault(e);
    });

    var mouseTarget = renderer.getMouseEventTarget();
    event.addListener(mouseTarget, "mousedown", this.onMouseDown.bind(this));
    event.addMultiMouseDownListener(mouseTarget, 0, 2, 500, this.onMouseDoubleClick.bind(this));
    event.addMultiMouseDownListener(mouseTarget, 0, 3, 600, this.onMouseTripleClick.bind(this));
    event.addMouseWheelListener(mouseTarget, this.onMouseWheel.bind(this));

    this.$selectionMarker = null;
    this.$highlightLineMarker = null;
    this.$blockScrolling = false;

    this.$search = new Search().set({
        wrap: true
    });

    this.setSession(session || new EditSession(""));
    this.focus();
};

(function(){

    oop.implement(this, EventEmitter);

    this.$forwardEvents = {
        gutterclick: 1,
        gutterdblclick: 1
    };

    this.$originalAddEventListener = this.addEventListener;
    this.$originalRemoveEventListener = this.removeEventListener;

    this.addEventListener = function(eventName, callback) {
        if (this.$forwardEvents[eventName]) {
            return this.renderer.addEventListener(eventName, callback);
        } else {
            return this.$originalAddEventListener(eventName, callback);
        }
    };

    this.removeEventListener = function(eventName, callback) {
        if (this.$forwardEvents[eventName]) {
            return this.renderer.removeEventListener(eventName, callback);
        } else {
            return this.$originalRemoveEventListener(eventName, callback);
        }
    };

    this.setKeyboardHandler = function(keyboardHandler) {
        this.keyBinding.setKeyboardHandler(keyboardHandler);
    };

    this.getKeyboardHandler = function() {
        return this.keyBinding.getKeyboardHandler();
    }

    this.setSession = function(session) {
        if (this.session == session) return;

        if (this.session) {
            this.session.removeEventListener("change", this.$onDocumentChange);
            this.session.removeEventListener("changeMode", this.$onDocumentModeChange);
            this.session.removeEventListener("changeTabSize", this.$onDocumentChangeTabSize);
            this.session.removeEventListener("changeBreakpoint", this.$onDocumentChangeBreakpoint);

            var selection = this.session.getSelection();
            selection.removeEventListener("changeCursor", this.$onCursorChange);
            selection.removeEventListener("changeSelection", this.$onSelectionChange);

            this.session.setScrollTopRow(this.renderer.getScrollTopRow());
        }

        this.session = session;

        this.$onDocumentChange = this.onDocumentChange.bind(this);
        session.addEventListener("change", this.$onDocumentChange);
        this.renderer.setSession(session);

        this.$onDocumentModeChange = this.onDocumentModeChange.bind(this);
        session.addEventListener("changeMode", this.$onDocumentModeChange);

        this.$onDocumentChangeTabSize = this.renderer.updateText.bind(this.renderer);
        session.addEventListener("changeTabSize", this.$onDocumentChangeTabSize);

        this.$onDocumentChangeBreakpoint = this.onDocumentChangeBreakpoint.bind(this);
        this.session.addEventListener("changeBreakpoint", this.$onDocumentChangeBreakpoint);

        this.selection = session.getSelection();
        this.$desiredColumn = 0;

        this.$onCursorChange = this.onCursorChange.bind(this);
        this.selection.addEventListener("changeCursor", this.$onCursorChange);

        this.$onSelectionChange = this.onSelectionChange.bind(this);
        this.selection.addEventListener("changeSelection", this.$onSelectionChange);

        this.onDocumentModeChange();
        this.bgTokenizer.setDocument(session.getDocument());
        this.bgTokenizer.start(0);

        this.onCursorChange();
        this.onSelectionChange();
        this.onDocumentChangeBreakpoint();
        this.renderer.scrollToRow(session.getScrollTopRow());
        this.renderer.updateFull();
    };

    this.getSession = function() {
        return this.session;
    };

    this.getSelection = function() {
        return this.selection;
    };

    this.resize = function() {
        this.renderer.onResize();
    };

    this.setTheme = function(theme) {
        this.renderer.setTheme(theme);
    };

    this.$highlightBrackets = function() {
        if (this.$bracketHighlight) {
            this.renderer.removeMarker(this.$bracketHighlight);
            this.$bracketHighlight = null;
        }

        if (this.$highlightPending) {
            return;
        }

        // perform highlight async to not block the browser during navigation
        var self = this;
        this.$highlightPending = true;
        setTimeout(function() {
            self.$highlightPending = false;

            var pos = self.session.findMatchingBracket(self.getCursorPosition());
            if (pos) {
                var range = new Range(pos.row, pos.column, pos.row, pos.column+1);
                self.$bracketHighlight = self.renderer.addMarker(range, "ace_bracket");
            }
        }, 10);
    };

    this.focus = function() {
        this.textInput.focus();
    };

    this.blur = function() {
        this.textInput.blur();
    };

    this.onFocus = function() {
        this.renderer.showCursor();
        this.renderer.visualizeFocus();
    };

    this.onBlur = function() {
        this.renderer.hideCursor();
        this.renderer.visualizeBlur();
    };

    this.onDocumentChange = function(e) {
        var delta = e.data;
        var range = delta.range;
        
        this.bgTokenizer.start(range.start.row);
        if (range.start.row == range.end.row)
            var lastRow = range.end.row;
        else 
            lastRow = Infinity;
        this.renderer.updateLines(range.start.row, lastRow);

        // update cursor because tab characters can influence the cursor position
        this.renderer.updateCursor(this.getCursorPosition(), this.$overwrite);
    };

    this.onTokenizerUpdate = function(e) {
        var rows = e.data;
        this.renderer.updateLines(rows.first, rows.last);
    };

    this.onCursorChange = function(e) {
        this.$highlightBrackets();
        this.renderer.updateCursor(this.getCursorPosition(), this.$overwrite);

        if (!this.$blockScrolling && (!e || !e.blockScrolling)) {
            this.renderer.scrollCursorIntoView();
        }
        this.$updateHighlightActiveLine();
    };

    this.$updateHighlightActiveLine = function() {
        if (this.$highlightLineMarker) {
            this.renderer.removeMarker(this.$highlightLineMarker);
        }
        this.$highlightLineMarker = null;

        if (this.getHighlightActiveLine() && (this.getSelectionStyle() != "line" || !this.selection.isMultiLine())) {
            var cursor = this.getCursorPosition();
            var range = new Range(cursor.row, 0, cursor.row+1, 0);
            this.$highlightLineMarker = this.renderer.addMarker(range, "ace_active_line", "line");
        }
    };

    this.onSelectionChange = function(e) {
        if (this.$selectionMarker) {
            this.renderer.removeMarker(this.$selectionMarker);
        }
        this.$selectionMarker = null;

        if (!this.selection.isEmpty()) {
            var range = this.selection.getRange();
            var style = this.getSelectionStyle();
            this.$selectionMarker = this.renderer.addMarker(range, "ace_selection", style);
        }

        this.onCursorChange(e);
    };

    this.onDocumentChangeBreakpoint = function() {
        this.renderer.setBreakpoints(this.session.getBreakpoints());
    };

    this.onDocumentModeChange = function() {
        var mode = this.session.getMode();
        if (this.mode == mode)
            return;

        this.mode = mode;
        var tokenizer = mode.getTokenizer();

        if (!this.bgTokenizer) {
            var onUpdate = this.onTokenizerUpdate.bind(this);
            this.bgTokenizer = new BackgroundTokenizer(tokenizer, this);
            this.bgTokenizer.addEventListener("update", onUpdate);
        } else {
            this.bgTokenizer.setTokenizer(tokenizer);
        }

        this.renderer.setTokenizer(this.bgTokenizer);
    };


    this.onMouseDown = function(e) {
        var pageX = event.getDocumentX(e);
        var pageY = event.getDocumentY(e);

        var pos = this.renderer.screenToTextCoordinates(pageX, pageY);
        pos.row = Math.max(0, Math.min(pos.row, this.session.getLength()-1));

        if (event.getButton(e) != 0) {
            if (this.selection.isEmpty()) {
                this.moveCursorToPosition(pos);
            }
            return;
        }

        if (e.shiftKey)
            this.selection.selectToPosition(pos)
        else {
            this.moveCursorToPosition(pos);
            if (!this.$clickSelection)
                this.selection.clearSelection(pos.row, pos.column);
        }

        this.renderer.scrollCursorIntoView();

        var self = this;
        var mousePageX, mousePageY;

        var onMouseSelection = function(e) {
            mousePageX = event.getDocumentX(e);
            mousePageY = event.getDocumentY(e);
        };

        var onMouseSelectionEnd = function() {
            clearInterval(timerId);
            self.$clickSelection = null;
        };

        var onSelectionInterval = function() {
            if (mousePageX === undefined || mousePageY === undefined)
                return;

            var cursor = self.renderer.screenToTextCoordinates(mousePageX, mousePageY);
            cursor.row = Math.max(0, Math.min(cursor.row, self.session.getLength()-1));

            if (self.$clickSelection) {
                if (self.$clickSelection.contains(cursor.row, cursor.column)) {
                    self.selection.setSelectionRange(self.$clickSelection);
                } else {
                    if (self.$clickSelection.compare(cursor.row, cursor.column) == -1) {
                        var anchor = self.$clickSelection.end;
                    } else {
                        var anchor = self.$clickSelection.start;
                    }
                    self.selection.setSelectionAnchor(anchor.row, anchor.column);
                    self.selection.selectToPosition(cursor);
                }
            }
            else {
                self.selection.selectToPosition(cursor);
            }

            self.renderer.scrollCursorIntoView();
        };

        event.capture(this.container, onMouseSelection, onMouseSelectionEnd);
        var timerId = setInterval(onSelectionInterval, 20);

        return event.preventDefault(e);
    };

    this.onMouseDoubleClick = function(e) {
        this.selection.selectWord();
        this.$clickSelection = this.getSelectionRange();
        this.$updateDesiredColumn();
    };

    this.onMouseTripleClick = function(e) {
        this.selection.selectLine();
        this.$clickSelection = this.getSelectionRange();
        this.$updateDesiredColumn();
    };

    this.onMouseWheel = function(e) {
        var speed = this.$scrollSpeed * 2;

        this.renderer.scrollBy(e.wheelX * speed, e.wheelY * speed);
        return event.preventDefault(e);
    };

    this.getCopyText = function() {
        if (!this.selection.isEmpty()) {
            return this.session.getTextRange(this.getSelectionRange());
        }
        else {
            return "";
        }
    };

    this.onCut = function() {
        if (this.$readOnly)
            return;

        if (!this.selection.isEmpty()) {
            this.moveCursorToPosition(this.session.remove(this.getSelectionRange()));
            this.clearSelection();
        }
    };

    this.insert = function(text) {
        if (this.$readOnly)
            return;

        var cursor = this.getCursorPosition();
        text = text.replace("\t", this.session.getTabString());

        // remove selected text
        if (!this.selection.isEmpty()) {
            var cursor = this.session.remove(this.getSelectionRange());
            this.clearSelection();
        } else if (this.$overwrite){
            var range = new Range.fromPoints(cursor, cursor);
            range.end.column += text.length;
            this.session.remove(range);
        }

        this.clearSelection();

        var lineState     = this.bgTokenizer.getState(cursor.row);
        var shouldOutdent = this.mode.checkOutdent(lineState, this.session.getLine(cursor.row), text);
        var line          = this.session.getLine(cursor.row);
        var lineIndent    = this.mode.getNextLineIndent(lineState, line.slice(0, cursor.column), this.session.getTabString());
        var end           = this.session.insert(cursor, text);

        /* TODO: This shortcut is somehow broken
        if (!shouldOutdent && line != this.session.getLine(row) && text != "\n") {
            this.moveCursorToPosition(end);
            this.renderer.scrollCursorIntoView();
            return;
        }
        */

        var lineState = this.bgTokenizer.getState(cursor.row);
        // multi line insert
        if (cursor.row !== end.row) {
            var size        = this.session.getTabSize(),
                minIndent   = Number.MAX_VALUE;

            for (var row = cursor.row + 1; row <= end.row; ++row) {
                var indent = 0;

                line = this.session.getLine(row);
                for (var i = 0; i < line.length; ++i)
                    if (line.charAt(i) == '\t')
                        indent += size;
                    else if (line.charAt(i) == ' ')
                        indent += 1;
                    else
                        break;
                if (/[^\s]/.test(line))
                    minIndent = Math.min(indent, minIndent);
            }

            for (var row = cursor.row + 1; row <= end.row; ++row) {
                var outdent = minIndent;

                line = this.session.getLine(row);
                for (var i = 0; i < line.length && outdent > 0; ++i)
                    if (line.charAt(i) == '\t')
                        outdent -= size;
                    else if (line.charAt(i) == ' ')
                        outdent -= 1;
                this.session.replace(new Range(row, 0, row, line.length), line.substr(i));
            }
            end.column += this.session.indentRows(cursor.row + 1, end.row, lineIndent);
        } else {
            if (shouldOutdent) {
                end.column += this.mode.autoOutdent(lineState, this.session, cursor.row);
            }
        }

        this.moveCursorToPosition(end);
        this.renderer.scrollCursorIntoView();
    }

    this.onTextInput = function(text) {
        this.keyBinding.onTextInput(text);
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        this.keyBinding.onCommandKey(e, hashId, keyCode);
    };

    this.$overwrite = false;
    this.setOverwrite = function(overwrite) {
        if (this.$overwrite == overwrite) return;

        this.$overwrite = overwrite;

        this.$blockScrolling = true;
        this.onCursorChange();
        this.$blockScrolling = false;

        this._dispatchEvent("changeOverwrite", {data: overwrite});
    };

    this.getOverwrite = function() {
        return this.$overwrite;
    };

    this.toggleOverwrite = function() {
        this.setOverwrite(!this.$overwrite);
    };


    this.$scrollSpeed = 1;
    this.setScrollSpeed = function(speed) {
        this.$scrollSpeed = speed;
    }

    this.getScrollSpeed = function() {
        return this.$scrollSpeed;
    }

    this.$selectionStyle = "line";
    this.setSelectionStyle = function(style) {
        if (this.$selectionStyle == style) return;

        this.$selectionStyle = style;
        this.onSelectionChange();
        this._dispatchEvent("changeSelectionStyle", {data: style});
    };


    this.getSelectionStyle = function() {
        return this.$selectionStyle;
    };

    this.$highlightActiveLine = true;
    this.setHighlightActiveLine = function(shouldHighlight) {
        if (this.$highlightActiveLine == shouldHighlight) return;

        this.$highlightActiveLine = shouldHighlight;
        this.$updateHighlightActiveLine();
    };

    this.getHighlightActiveLine = function() {
        return this.$highlightActiveLine;
    };

    this.setShowInvisibles = function(showInvisibles) {
        if (this.getShowInvisibles() == showInvisibles)
            return;

        this.renderer.setShowInvisibles(showInvisibles);
    };

    this.getShowInvisibles = function() {
        return this.renderer.getShowInvisibles();
    };

    this.setShowPrintMargin = function(showPrintMargin) {
        this.renderer.setShowPrintMargin(showPrintMargin);
    };

    this.getShowPrintMargin = function() {
        return this.renderer.getShowPrintMargin();
    };

    this.setPrintMarginColumn = function(showPrintMargin) {
        this.renderer.setPrintMarginColumn(showPrintMargin);
    };

    this.getPrintMarginColumn = function() {
        return this.renderer.getPrintMarginColumn();
    };

    this.$readOnly = false;
    this.setReadOnly = function(readOnly) {
        this.$readOnly = readOnly;
    };

    this.getReadOnly = function() {
        return this.$readOnly;
    };

    this.removeRight = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty()) {
            this.selection.selectRight();
        }
        this.moveCursorToPosition(this.session.remove(this.getSelectionRange()));
        this.clearSelection();
    };

    this.removeLeft = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty())
            this.selection.selectLeft();

        this.moveCursorToPosition(this.session.remove(this.getSelectionRange()));
        this.clearSelection();
    };

    this.indent = function() {
        if (this.$readOnly)
            return;

        var session = this.session;
        var range = this.getSelectionRange();

        if (range.start.row < range.end.row || range.start.column < range.end.column) {
            var rows = this.$getSelectedRows();
            var count = session.indentRows(rows.first, rows.last, "\t");

            this.selection.shiftSelection(count);
        } else {
            var indentString;

            if (this.session.getUseSoftTabs()) {
                var size        = session.getTabSize(),
                    position    = this.getCursorPosition(),
                    column      = session.documentToScreenColumn(position.row, position.column),
                    count       = (size - column % size);

                indentString = lang.stringRepeat(" ", count);
            } else
                indentString = "\t";
            return this.onTextInput(indentString);
        }
    };

    this.blockOutdent = function() {
        if (this.$readOnly)
            return;

        var selection = this.session.getSelection();
        var range = this.session.outdentRows(selection.getRange());

        selection.setSelectionRange(range, selection.isBackwards());
        this.$updateDesiredColumn();
    };

    this.toggleCommentLines = function() {
        if (this.$readOnly)
            return;

        var state = this.bgTokenizer.getState(this.getCursorPosition().row);
        var rows = this.$getSelectedRows()
        var addedColumns = this.mode.toggleCommentLines(state, this.session, rows.first, rows.last);
        this.selection.shiftSelection(addedColumns);
    };

    this.removeLines = function() {
        if (this.$readOnly)
            return;

        var rows = this.$getSelectedRows();
        this.selection.setSelectionAnchor(rows.last+1, 0);
        this.selection.selectTo(rows.first, 0);

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };

    this.moveLinesDown = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesDown(firstRow, lastRow);
        });
    };

    this.moveLinesUp = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesUp(firstRow, lastRow);
        });
    };

    this.copyLinesUp = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            this.session.duplicateLines(firstRow, lastRow);
            return 0;
        });
    };

    this.copyLinesDown = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            return this.session.duplicateLines(firstRow, lastRow);
        });
    };


    this.$moveLines = function(mover) {
        var rows = this.$getSelectedRows();

        var linesMoved = mover.call(this, rows.first, rows.last);

        var selection = this.selection;
        selection.setSelectionAnchor(rows.last+linesMoved+1, 0);
        selection.$moveSelection(function() {
            selection.moveCursorTo(rows.first+linesMoved, 0);
        });
    };

    this.$getSelectedRows = function() {
        var range = this.getSelectionRange().collapseRows();

        return {
            first: range.start.row,
            last: range.end.row
        };
    };

    this.onCompositionStart = function(text) {
        this.renderer.showComposition(this.getCursorPosition());
        //this.onTextInput(text);
    };

    this.onCompositionUpdate = function(text) {
        this.renderer.setCompositionText(text);
    };

    this.onCompositionEnd = function() {
        this.renderer.hideComposition();
        //this.removeLeft();
    };


    this.getFirstVisibleRow = function() {
        return this.renderer.getFirstVisibleRow();
    };

    this.getLastVisibleRow = function() {
        return this.renderer.getLastVisibleRow();
    };

    this.isRowVisible = function(row) {
        return (row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow());
    };

    this.getVisibleRowCount = function() {
        return this.getLastVisibleRow() - this.getFirstVisibleRow() + 1;
    };

    this.getPageDownRow = function() {
        return this.renderer.getLastVisibleRow() - 1;
    };

    this.getPageUpRow = function() {
        var firstRow = this.renderer.getFirstVisibleRow();
        var lastRow = this.renderer.getLastVisibleRow();

        return firstRow - (lastRow - firstRow) + 1;
    };

    this.selectPageDown = function() {
        var row = this.getPageDownRow() + Math.floor(this.getVisibleRowCount() / 2);

        this.scrollPageDown();

        var selection = this.getSelection();
        selection.$moveSelection(function() {
            selection.moveCursorTo(row, selection.getSelectionLead().column);
        });
    };

    this.selectPageUp = function() {
        var visibleRows = this.getLastVisibleRow() - this.getFirstVisibleRow();
        var row = this.getPageUpRow() + Math.round(visibleRows / 2);

        this.scrollPageUp();

        var selection = this.getSelection();
        selection.$moveSelection(function() {
            selection.moveCursorTo(row, selection.getSelectionLead().column);
        });
    };

    this.gotoPageDown = function() {
        var row     = this.getPageDownRow(),
            column  = Math.min(this.getCursorPosition().column,
                               this.session.getLine(row).length);

        this.scrollToRow(row);
        this.getSelection().moveCursorTo(row, column);
    };

    this.gotoPageUp = function() {
       var  row     = this.getPageUpRow(),
            column  = Math.min(this.getCursorPosition().column,
                               this.session.getLine(row).length);

       this.scrollToRow(row);
       this.getSelection().moveCursorTo(row, column);
    };

    this.scrollPageDown = function() {
        this.scrollToRow(this.getPageDownRow());
    };

    this.scrollPageUp = function() {
        this.renderer.scrollToRow(this.getPageUpRow());
    };

    this.scrollToRow = function(row) {
        this.renderer.scrollToRow(row);
    };


    this.getCursorPosition = function() {
        return this.selection.getCursor();
    };

    this.getSelectionRange = function() {
        return this.selection.getRange();
    };

    this.clearSelection = function() {
        this.selection.clearSelection();
        this.$updateDesiredColumn();
    };

    this.moveCursorTo = function(row, column) {
        this.selection.moveCursorTo(row, column);
        this.$updateDesiredColumn();
    };

    this.moveCursorToPosition = function(pos) {
        this.selection.moveCursorToPosition(pos);
        this.$updateDesiredColumn();
    };


    this.gotoLine = function(lineNumber, row) {
        this.selection.clearSelection();

        this.$blockScrolling = true;
        this.moveCursorTo(lineNumber-1, row || 0);
        this.$blockScrolling = false;

        if (!this.isRowVisible(this.getCursorPosition().row)) {
            this.scrollToRow(lineNumber - 1 - Math.floor(this.getVisibleRowCount() / 2));
        }
    },

    this.navigateTo = function(row, column) {
        this.clearSelection();
        this.moveCursorTo(row, column);
        this.$updateDesiredColumn(column);
    };

    this.navigateUp = function(times) {
        this.selection.clearSelection();
        this.selection.moveCursorBy(-(times || 1), 0);

        if (this.$desiredColumn) {
            var cursor = this.getCursorPosition();
            var column = this.session.screenToDocumentColumn(cursor.row, this.$desiredColumn);
            this.selection.moveCursorTo(cursor.row, column);
        }
    };

    this.navigateDown = function(times) {
        this.selection.clearSelection();
        this.selection.moveCursorBy(times || 1, 0);

        if (this.$desiredColumn) {
            var cursor = this.getCursorPosition();
            var column = this.session.screenToDocumentColumn(cursor.row, this.$desiredColumn);
            this.selection.moveCursorTo(cursor.row, column);
        }
    };

    this.$updateDesiredColumn = function() {
        var cursor = this.getCursorPosition();
        this.$desiredColumn = this.session.documentToScreenColumn(cursor.row, cursor.column);
    };

    this.navigateLeft = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionStart = this.getSelectionRange().start;
            this.moveCursorToPosition(selectionStart);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorLeft();
            }
        }
        this.clearSelection();
    };

    this.navigateRight = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionEnd = this.getSelectionRange().end;
            this.moveCursorToPosition(selectionEnd);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorRight();
            }
        }
        this.clearSelection();
    };

    this.navigateLineStart = function() {
        this.selection.moveCursorLineStart();
        this.clearSelection();
    };

    this.navigateLineEnd = function() {
        this.selection.moveCursorLineEnd();
        this.clearSelection();
    };

    this.navigateFileEnd = function() {
        this.selection.moveCursorFileEnd();
        this.clearSelection();
    };

    this.navigateFileStart = function() {
        this.selection.moveCursorFileStart();
        this.clearSelection();
    };

    this.navigateWordRight = function() {
        this.selection.moveCursorWordRight();
        this.clearSelection();
    };

    this.navigateWordLeft = function() {
        this.selection.moveCursorWordLeft();
        this.clearSelection();
    };

    this.replace = function(replacement, options) {
        if (options)
            this.$search.set(options);

        var range = this.$search.find(this.session);
        this.$tryReplace(range, replacement);
        if (range !== null)
            this.selection.setSelectionRange(range);
        this.$updateDesiredColumn();
    },

    this.replaceAll = function(replacement, options) {
        if (options) {
            this.$search.set(options);
        }

        var ranges = this.$search.findAll(this.session);
        if (!ranges.length)
            return;

        this.clearSelection();
        this.selection.moveCursorTo(0, 0);

        for (var i = ranges.length - 1; i >= 0; --i)
            this.$tryReplace(ranges[i], replacement);
        if (ranges[0] !== null)
            this.selection.setSelectionRange(ranges[0]);
        this.$updateDesiredColumn();
    },

    this.$tryReplace = function(range, replacement) {
        var input = this.session.getTextRange(range);
        var replacement = this.$search.replace(input, replacement);
        if (replacement !== null) {
            range.end = this.session.replace(range, replacement);
            return range;
        } else {
            return null;
        }
    };

    this.getLastSearchOptions = function() {
        return this.$search.getOptions();
    };

    this.find = function(needle, options) {
        this.clearSelection();
        options = options || {};
        options.needle = needle;
        this.$search.set(options);
        this.$find();
    },

    this.findNext = function(options) {
        options = options || {};
        if (typeof options.backwards == "undefined")
            options.backwards = false;
        this.$search.set(options);
        this.$find();
    };

    this.findPrevious = function(options) {
        options = options || {};
        if (typeof options.backwards == "undefined")
            options.backwards = true;
        this.$search.set(options);
        this.$find();
    };

    this.$find = function(backwards) {
        if (!this.selection.isEmpty()) {
            this.$search.set({needle: this.session.getTextRange(this.getSelectionRange())});
        }

        if (typeof backwards != "undefined")
            this.$search.set({backwards: backwards});

        var range = this.$search.find(this.session);
        if (range) {
            this.gotoLine(range.end.row+1, range.end.column);
            this.$updateDesiredColumn();
            this.selection.setSelectionRange(range);
        }
    };

    this.undo = function() {
        this.session.getUndoManager().undo();
    };

    this.redo = function() {
        this.session.getUndoManager().redo();
    };

}).call(Editor.prototype);


exports.Editor = Editor;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/range', function(require, exports, module) {

var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {

    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };

    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };

    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow) {
            var end = {
                row: lastRow+1,
                column: 0
            };
        }

        if (this.start.row > lastRow) {
            var start = {
                row: lastRow+1,
                column: 0
            };
        }

        if (this.start.row < firstRow) {
            var start = {
                row: firstRow,
                column: 0
            };
        }

        if (this.end.row < firstRow) {
            var end = {
                row: firstRow,
                column: 0
            };
        }
        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row == this.end.row && this.start.column == this.end.column);
    };

    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };

    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };
    
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };

    this.toScreenRange = function(doc) {
        return new Range(
            this.start.row, doc.documentToScreenColumn(this.start.row, this.start.column),
            this.end.row, doc.documentToScreenColumn(this.end.row, this.end.column)
        );
    };

}).call(Range.prototype);


Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};

exports.Range = Range;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/commands/default_commands', function(require, exports, module) {

var lang = require("pilot/lang");
var canon = require("pilot/canon");

canon.addCommand({
    name: "null",
    exec: function(env, args, request) {  }
});

canon.addCommand({
    name: "selectall",
    exec: function(env, args, request) { env.editor.getSelection().selectAll(); }
});
canon.addCommand({
    name: "removeline",
    exec: function(env, args, request) { env.editor.removeLines(); }
});
canon.addCommand({
    name: "gotoline",
    exec: function(env, args, request) {
        var line = parseInt(prompt("Enter line number:"));
        if (!isNaN(line)) {
            env.editor.gotoLine(line);
        }
    }
});
canon.addCommand({
    name: "togglecomment",
    exec: function(env, args, request) { env.editor.toggleCommentLines(); }
});
canon.addCommand({
    name: "findnext",
    exec: function(env, args, request) { env.editor.findNext(); }
});
canon.addCommand({
    name: "findprevious",
    exec: function(env, args, request) { env.editor.findPrevious(); }
});
canon.addCommand({
    name: "find",
    exec: function(env, args, request) {
        var needle = prompt("Find:");
        env.editor.find(needle);
    }
});
canon.addCommand({
    name: "undo",
    exec: function(env, args, request) { env.editor.undo(); }
});
canon.addCommand({
    name: "redo",
    exec: function(env, args, request) { env.editor.redo(); }
});
canon.addCommand({
    name: "redo",
    exec: function(env, args, request) { env.editor.redo(); }
});
canon.addCommand({
    name: "overwrite",
    exec: function(env, args, request) { env.editor.toggleOverwrite(); }
});
canon.addCommand({
    name: "copylinesup",
    exec: function(env, args, request) { env.editor.copyLinesUp(); }
});
canon.addCommand({
    name: "movelinesup",
    exec: function(env, args, request) { env.editor.moveLinesUp(); }
});
canon.addCommand({
    name: "selecttostart",
    exec: function(env, args, request) { env.editor.getSelection().selectFileStart(); }
});
canon.addCommand({
    name: "gotostart",
    exec: function(env, args, request) { env.editor.navigateFileStart(); }
});
canon.addCommand({
    name: "selectup",
    exec: function(env, args, request) { env.editor.getSelection().selectUp(); }
});
canon.addCommand({
    name: "golineup",
    exec: function(env, args, request) { env.editor.navigateUp(args.times); }
});
canon.addCommand({
    name: "copylinesdown",
    exec: function(env, args, request) { env.editor.copyLinesDown(); }
});
canon.addCommand({
    name: "movelinesdown",
    exec: function(env, args, request) { env.editor.moveLinesDown(); }
});
canon.addCommand({
    name: "selecttoend",
    exec: function(env, args, request) { env.editor.getSelection().selectFileEnd(); }
});
canon.addCommand({
    name: "gotoend",
    exec: function(env, args, request) { env.editor.navigateFileEnd(); }
});
canon.addCommand({
    name: "selectdown",
    exec: function(env, args, request) { env.editor.getSelection().selectDown(); }
});
canon.addCommand({
    name: "golinedown",
    exec: function(env, args, request) { env.editor.navigateDown(args.times); }
});
canon.addCommand({
    name: "selectwordleft",
    exec: function(env, args, request) { env.editor.getSelection().selectWordLeft(); }
});
canon.addCommand({
    name: "gotowordleft",
    exec: function(env, args, request) { env.editor.navigateWordLeft(); }
});
canon.addCommand({
    name: "selecttolinestart",
    exec: function(env, args, request) { env.editor.getSelection().selectLineStart(); }
});
canon.addCommand({
    name: "gotolinestart",
    exec: function(env, args, request) { env.editor.navigateLineStart(); }
});
canon.addCommand({
    name: "selectleft",
    exec: function(env, args, request) { env.editor.getSelection().selectLeft(); }
});
canon.addCommand({
    name: "gotoleft",
    exec: function(env, args, request) { env.editor.navigateLeft(args.times); }
});
canon.addCommand({
    name: "selectwordright",
    exec: function(env, args, request) { env.editor.getSelection().selectWordRight(); }
});
canon.addCommand({
    name: "gotowordright",
    exec: function(env, args, request) { env.editor.navigateWordRight(); }
});
canon.addCommand({
    name: "selecttolineend",
    exec: function(env, args, request) { env.editor.getSelection().selectLineEnd(); }
});
canon.addCommand({
    name: "gotolineend",
    exec: function(env, args, request) { env.editor.navigateLineEnd(); }
});
canon.addCommand({
    name: "selectright",
    exec: function(env, args, request) { env.editor.getSelection().selectRight(); }
});
canon.addCommand({
    name: "gotoright",
    exec: function(env, args, request) { env.editor.navigateRight(args.times); }
});
canon.addCommand({
    name: "selectpagedown",
    exec: function(env, args, request) { env.editor.selectPageDown(); }
});
canon.addCommand({
    name: "pagedown",
    exec: function(env, args, request) { env.editor.scrollPageDown(); }
});
canon.addCommand({
    name: "gotopagedown",
    exec: function(env, args, request) { env.editor.gotoPageDown(); }
});
canon.addCommand({
    name: "selectpageup",
    exec: function(env, args, request) { env.editor.selectPageUp(); }
});
canon.addCommand({
    name: "pageup",
    exec: function(env, args, request) { env.editor.scrollPageUp(); }
});
canon.addCommand({
    name: "gotopageup",
    exec: function(env, args, request) { env.editor.gotoPageUp(); }
});
canon.addCommand({
    name: "selectlinestart",
    exec: function(env, args, request) { env.editor.getSelection().selectLineStart(); }
});
canon.addCommand({
    name: "gotolinestart",
    exec: function(env, args, request) { env.editor.navigateLineStart(); }
});
canon.addCommand({
    name: "selectlineend",
    exec: function(env, args, request) { env.editor.getSelection().selectLineEnd(); }
});
canon.addCommand({
    name: "gotolineend",
    exec: function(env, args, request) { env.editor.navigateLineEnd(); }
});
canon.addCommand({
    name: "del",
    exec: function(env, args, request) { env.editor.removeRight(); }
});
canon.addCommand({
    name: "backspace",
    exec: function(env, args, request) { env.editor.removeLeft(); }
});
canon.addCommand({
    name: "outdent",
    exec: function(env, args, request) { env.editor.blockOutdent(); }
});
canon.addCommand({
    name: "indent",
    exec: function(env, args, request) { env.editor.indent(); }
});
canon.addCommand({
    name: "inserttext",
    exec: function(env, args, request) {
        env.editor.insert(lang.stringRepeat(args.text  || "",
                                            args.times || 1));
    }
});

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/search', function(require, exports, module) {

var lang = require("pilot/lang");
var oop = require("pilot/oop");
var Range = require("ace/range").Range;

var Search = function() {
    this.$options = {
        needle: "",
        backwards: false,
        wrap: false,
        caseSensitive: false,
        wholeWord: false,
        scope: Search.ALL,
        regExp: false
    };
};

Search.ALL = 1;
Search.SELECTION = 2;

(function() {

    this.set = function(options) {
        oop.mixin(this.$options, options);
        return this;
    };
    
    this.getOptions = function() {
        return lang.copyObject(this.$options);
    };

    this.find = function(session) {
        if (!this.$options.needle)
            return null;

        if (this.$options.backwards) {
            var iterator = this.$backwardMatchIterator(session);
        } else {
            iterator = this.$forwardMatchIterator(session);
        }

        var firstRange = null;
        iterator.forEach(function(range) {
            firstRange = range;
            return true;
        });

        return firstRange;
    };

    this.findAll = function(session) {
        if (!this.$options.needle)
            return [];

        if (this.$options.backwards) {
            var iterator = this.$backwardMatchIterator(session);
        } else {
            iterator = this.$forwardMatchIterator(session);
        }

        var ranges = [];
        iterator.forEach(function(range) {
            ranges.push(range);
        });

        return ranges;
    };

    this.replace = function(input, replacement) {
        var re = this.$assembleRegExp();
        var match = re.exec(input);
        if (match && match[0].length == input.length) {
            if (this.$options.regExp) {
                return input.replace(re, replacement);
            } else {
                return replacement;
            }
        } else {
            return null;
        }
    };

    this.$forwardMatchIterator = function(session) {
        var re = this.$assembleRegExp();
        var self = this;

        return {
            forEach: function(callback) {
                self.$forwardLineIterator(session).forEach(function(line, startIndex, row) {
                    if (startIndex) {
                        line = line.substring(startIndex);
                    }

                    var matches = [];

                    line.replace(re, function(str) {
                        var offset = arguments[arguments.length-2];
                        matches.push({
                            str: str,
                            offset: startIndex + offset
                        });
                        return str;
                    });

                    for (var i=0; i<matches.length; i++) {
                        var match = matches[i];
                        var range = self.$rangeFromMatch(row, match.offset, match.str.length);
                        if (callback(range))
                            return true;
                    }

                });
            }
        };
    };

    this.$backwardMatchIterator = function(session) {
        var re = this.$assembleRegExp();
        var self = this;

        return {
            forEach: function(callback) {
                self.$backwardLineIterator(session).forEach(function(line, startIndex, row) {
                    if (startIndex) {
                        line = line.substring(startIndex);
                    }

                    var matches = [];

                    line.replace(re, function(str, offset) {
                        matches.push({
                            str: str,
                            offset: startIndex + offset
                        });
                        return str;
                    });

                    for (var i=matches.length-1; i>= 0; i--) {
                        var match = matches[i];
                        var range = self.$rangeFromMatch(row, match.offset, match.str.length);
                        if (callback(range))
                            return true;
                    }
                });
            }
        };
    };

    this.$rangeFromMatch = function(row, column, length) {
        return new Range(row, column, row, column+length);
    };

    this.$assembleRegExp = function() {
        if (this.$options.regExp) {
            var needle = this.$options.needle;
        } else {
            needle = lang.escapeRegExp(this.$options.needle);
        }

        if (this.$options.wholeWord) {
            needle = "\\b" + needle + "\\b";
        }

        var modifier = "g";
        if (!this.$options.caseSensitive) {
            modifier += "i";
        }

        var re = new RegExp(needle, modifier);
        return re;
    };

    this.$forwardLineIterator = function(session) {
        var searchSelection = this.$options.scope == Search.SELECTION;

        var range = session.getSelection().getRange();
        var start = session.getSelection().getCursor();

        var firstRow = searchSelection ? range.start.row : 0;
        var firstColumn = searchSelection ? range.start.column : 0;
        var lastRow = searchSelection ? range.end.row : session.getLength() - 1;

        var wrap = this.$options.wrap;

        function getLine(row) {
            var line = session.getLine(row);
            if (searchSelection && row == range.end.row) {
                line = line.substring(0, range.end.column);
            }
            return line;
        }

        return {
            forEach: function(callback) {
                var row = start.row;

                var line = getLine(row);
                var startIndex = start.column;

                var stop = false;

                while (!callback(line, startIndex, row)) {

                    if (stop) {
                        return;
                    }

                    row++;
                    startIndex = 0;

                    if (row > lastRow) {
                        if (wrap) {
                            row = firstRow;
                            startIndex = firstColumn;
                        } else {
                            return;
                        }
                    }

                    if (row == start.row)
                        stop = true;

                    line = getLine(row);
                }
            }
        };
    };

    this.$backwardLineIterator = function(session) {
        var searchSelection = this.$options.scope == Search.SELECTION;

        var range = session.getSelection().getRange();
        var start = searchSelection ? range.end : range.start;

        var firstRow = searchSelection ? range.start.row : 0;
        var firstColumn = searchSelection ? range.start.column : 0;
        var lastRow = searchSelection ? range.end.row : session.getLength() - 1;

        var wrap = this.$options.wrap;

        return {
            forEach : function(callback) {
                var row = start.row;

                var line = session.getLine(row).substring(0, start.column);
                var startIndex = 0;
                var stop = false;

                while (!callback(line, startIndex, row)) {

                    if (stop)
                        return;

                    row--;
                    startIndex = 0;

                    if (row < firstRow) {
                        if (wrap) {
                            row = lastRow;
                        } else {
                            return;
                        }
                    }

                    if (row == start.row)
                        stop = true;

                    line = session.getLine(row);
                    if (searchSelection) {
                        if (row == firstRow)
                            startIndex = firstColumn;
                        else if (row == lastRow)
                            line = line.substring(0, range.end.column);
                    }
                }
            }
        };
    };

}).call(Search.prototype);

exports.Search = Search;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/background_tokenizer', function(require, exports, module) {

var oop = require("pilot/oop");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var BackgroundTokenizer = function(tokenizer, editor) {
    this.running = false;
    this.doc = [];
    this.lines = [];
    this.currentLine = 0;
    this.tokenizer = tokenizer;

    var self = this;

    this.$worker = function() {
        if (!self.running) { return; }

        var workerStart = new Date();
        var startLine = self.currentLine;
        var doc = self.doc;

        var processedLines = 0;
        var lastVisibleRow = editor.getLastVisibleRow();

        var len = doc.getLength();
        while (self.currentLine < len) {
            self.lines[self.currentLine] = self.$tokenizeRows(self.currentLine, self.currentLine)[0];
            self.currentLine++;

            // only check every 5 lines
            processedLines += 1;
            if ((processedLines % 5 == 0) && (new Date() - workerStart) > 20) {
                self.fireUpdateEvent(startLine, self.currentLine-1);

                var timeout = self.currentLine < lastVisibleRow ? 20 : 100;
                self.running = setTimeout(self.$worker, timeout);
                return;
            }
        }

        self.running = false;

        self.fireUpdateEvent(startLine, len - 1);
    };
};

(function(){

    oop.implement(this, EventEmitter);

    this.setTokenizer = function(tokenizer) {
        this.tokenizer = tokenizer;
        this.lines = [];

        this.start(0);
    };

    this.setDocument = function(doc) {
        this.doc = doc;
        this.lines = [];

        this.stop();
    };

    this.fireUpdateEvent = function(firstRow, lastRow) {
        var data = {
            first: firstRow,
            last: lastRow
        };
        this._dispatchEvent("update", {data: data});
    };

    this.start = function(startRow) {
        this.currentLine = Math.min(startRow || 0, this.currentLine,
                                    this.doc.getLength());

        // remove all cached items below this line
        this.lines.splice(this.currentLine, this.lines.length);

        this.stop();
        // pretty long delay to prevent the tokenizer from interfering with the user
        this.running = setTimeout(this.$worker, 700);
    };

    this.stop = function() {
        if (this.running)
            clearTimeout(this.running);
        this.running = false;
    };

    this.getTokens = function(firstRow, lastRow) {
        return this.$tokenizeRows(firstRow, lastRow);
    };

    this.getState = function(row) {
        return this.$tokenizeRows(row, row)[0].state;
    };

    this.$tokenizeRows = function(firstRow, lastRow) {
        var rows = [];

        // determine start state
        var state = "start";
        var doCache = false;
        if (firstRow > 0 && this.lines[firstRow - 1]) {
            state = this.lines[firstRow - 1].state;
            doCache = true;
        }

        var lines = this.doc.getLines(firstRow, lastRow);
        for (var row=firstRow; row<=lastRow; row++) {
            if (!this.lines[row]) {
                var tokens = this.tokenizer.getLineTokens(lines[row-firstRow] || "", state);
                var state = tokens.state;
                rows.push(tokens);

                if (doCache) {
                    this.lines[row] = tokens;
                }
            }
            else {
                var tokens = this.lines[row];
                state = tokens.state;
                rows.push(tokens);
            }
        }
        return rows;
    };

}).call(BackgroundTokenizer.prototype);

exports.BackgroundTokenizer = BackgroundTokenizer;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/virtual_renderer', function(require, exports, module) {

var oop = require("pilot/oop");
var dom = require("pilot/dom");
var event = require("pilot/event");
var GutterLayer = require("ace/layer/gutter").Gutter;
var MarkerLayer = require("ace/layer/marker").Marker;
var TextLayer = require("ace/layer/text").Text;
var CursorLayer = require("ace/layer/cursor").Cursor;
var ScrollBar = require("ace/scrollbar").ScrollBar;
var RenderLoop = require("ace/renderloop").RenderLoop;
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var editorCss = require("text!ace/css/editor.css");

// import CSS once
dom.importCssString(editorCss);

var VirtualRenderer = function(container, theme) {
    this.container = container;
    dom.addCssClass(this.container, "ace_editor");

    this.setTheme(theme);

    this.$gutter = document.createElement("div");
    this.$gutter.className = "ace_gutter";
    this.container.appendChild(this.$gutter);

    this.scroller = document.createElement("div");
    this.scroller.className = "ace_scroller";
    this.container.appendChild(this.scroller);

    this.content = document.createElement("div");
    this.content.style.cssText = "position:absolute;box-sizing:border-box;" +
        "-moz-box-sizing:border-box;-webkit-box-sizing:border-box";
    this.scroller.appendChild(this.content);

    this.$gutterLayer = new GutterLayer(this.$gutter);
    this.$markerLayer = new MarkerLayer(this.content);

    var textLayer = this.$textLayer = new TextLayer(this.content);
    this.canvas = textLayer.element;

    this.characterWidth = textLayer.getCharacterWidth();
    this.lineHeight = textLayer.getLineHeight();

    this.$cursorLayer = new CursorLayer(this.content);

    this.layers = [ this.$markerLayer, textLayer, this.$cursorLayer ];

    this.scrollBar = new ScrollBar(container);
    this.scrollBar.addEventListener("scroll", this.onScroll.bind(this));

    this.scrollTop = 0;

    this.cursorPos = {
        row : 0,
        column : 0
    };

    var self = this;
    this.$textLayer.addEventListener("changeCharaterSize", function() {
        self.characterWidth = textLayer.getCharacterWidth();
        self.lineHeight = textLayer.getLineHeight();

        self.$loop.schedule(self.CHANGE_FULL);
    });
    event.addListener(this.$gutter, "click", this.$onGutterClick.bind(this));
    event.addListener(this.$gutter, "dblclick", this.$onGutterClick.bind(this));

    this.$size = {
        width: 0,
        height: 0,
        scrollerHeight: 0,
        scrollerWidth: 0
    };

    this.$loop = new RenderLoop(this.$renderChanges.bind(this));
    this.$loop.schedule(this.CHANGE_FULL);

    this.$updatePrintMargin();
    this.setPadding(4);
};

(function() {

    this.showGutter = true;

    this.CHANGE_CURSOR = 1;
    this.CHANGE_MARKER = 2;
    this.CHANGE_GUTTER = 4;
    this.CHANGE_SCROLL = 8;
    this.CHANGE_LINES = 16;
    this.CHANGE_TEXT = 32;
    this.CHANGE_SIZE = 64;
    this.CHANGE_FULL = 128;

    oop.implement(this, EventEmitter);

    this.setSession = function(session) {
        this.session = session;
        this.$cursorLayer.setSession(session);
        this.$markerLayer.setSession(session);
        this.$textLayer.setSession(session);

        this.$loop.schedule(this.CHANGE_FULL);
    };

    /**
     * Triggers partial update of the text layer
     */
    this.updateLines = function(firstRow, lastRow) {
        if (lastRow === undefined)
            lastRow = Infinity;

        if (!this.$changedLines) {
            this.$changedLines = {
                firstRow: firstRow,
                lastRow: lastRow
            };
        }
        else {
            if (this.$changedLines.firstRow > firstRow)
                this.$changedLines.firstRow = firstRow;

            if (this.$changedLines.lastRow < lastRow)
                this.$changedLines.lastRow = lastRow;
        }

        this.$loop.schedule(this.CHANGE_LINES);
    };

    /**
     * Triggers full update of the text layer
     */
    this.updateText = function() {
        this.$loop.schedule(this.CHANGE_TEXT);
    };

    /**
     * Triggers a full update of all layers
     */
    this.updateFull = function() {
        this.$loop.schedule(this.CHANGE_FULL);
    };

    /**
     * Triggers resize of the editor
     */
    this.onResize = function() {
        var changes = this.CHANGE_SIZE;

        var height = dom.getInnerHeight(this.container);
        if (this.$size.height != height) {
            this.$size.height = height;

            this.scroller.style.height = height + "px";
            this.scrollBar.setHeight(height);

            if (this.session) {
                this.scrollToY(this.getScrollTop());
                changes = changes | this.CHANGE_FULL;
            }
        }

        var width = dom.getInnerWidth(this.container);
        if (this.$size.width != width) {
            this.$size.width = width;

            var gutterWidth = this.showGutter ? this.$gutter.offsetWidth : 0;
            this.scroller.style.left = gutterWidth + "px";
            this.scroller.style.width = Math.max(0, width - gutterWidth - this.scrollBar.getWidth()) + "px";
        }

        this.$size.scrollerWidth = this.scroller.clientWidth;
        this.$size.scrollerHeight = this.scroller.clientHeight;
        this.$loop.schedule(changes);
    };

    this.setTokenizer = function(tokenizer) {
        this.$tokenizer = tokenizer;
        this.$textLayer.setTokenizer(tokenizer);
        this.$loop.schedule(this.CHANGE_TEXT);
    };

    this.$onGutterClick = function(e) {
        var pageX = event.getDocumentX(e);
        var pageY = event.getDocumentY(e);

        this._dispatchEvent("gutter" + e.type, {
            row: this.screenToTextCoordinates(pageX, pageY).row,
            htmlEvent: e
        });
    };

    this.setShowInvisibles = function(showInvisibles) {
        if (this.$textLayer.setShowInvisibles(showInvisibles))
            this.$loop.schedule(this.CHANGE_TEXT);
    };

    this.getShowInvisibles = function() {
        return this.$textLayer.showInvisibles;
    };

    this.$showPrintMargin = true;
    this.setShowPrintMargin = function(showPrintMargin) {
        this.$showPrintMargin = showPrintMargin;
        this.$updatePrintMargin();
    };

    this.getShowPrintMargin = function() {
        return this.$showPrintMargin;
    };

    this.$printMarginColumn = 80;
    this.setPrintMarginColumn = function(showPrintMargin) {
        this.$printMarginColumn = showPrintMargin;
        this.$updatePrintMargin();
    };

    this.getPrintMarginColumn = function() {
        return this.$printMarginColumn;
    };

    this.setShowGutter = function(show){
        this.$gutter.style.display = show ? "block" : "none";
        this.showGutter = show;
        this.onResize();
    }

    this.$updatePrintMargin = function() {
        if (!this.$showPrintMargin && !this.$printMarginEl)
            return;

        if (!this.$printMarginEl) {
            this.$printMarginEl = document.createElement("div");
            this.content.insertBefore(this.$printMarginEl, this.$textLayer.element);
            this.$printMarginEl.className = "ace_print_margin";
        }

        var style = this.$printMarginEl.style;
        style.left = (this.characterWidth * this.$printMarginColumn) + "px";
        style.visibility = this.$showPrintMargin ? "visible" : "hidden";
    };

    this.getContainerElement = function() {
        return this.container;
    };

    this.getMouseEventTarget = function() {
        return this.content;
    };

    this.getFirstVisibleRow = function() {
        return (this.layerConfig || {}).firstRow || 0;
    };

    this.getFirstFullyVisibleRow = function(){
        if (!this.layerConfig)
            return 0;

        return this.layerConfig.firstRow + (this.layerConfig.offset == 0 ? 0 : 1);
    }

    this.getLastFullyVisibleRow = function() {
        if (!this.layerConfig)
            return 0;

        var flint = Math.floor((this.layerConfig.height + this.layerConfig.offset) / this.layerConfig.lineHeight);
        return this.layerConfig.firstRow - 1 + flint;
    }

    this.getLastVisibleRow = function() {
        return (this.layerConfig || {}).lastRow || 0;
    };

    this.$padding = null;
    this.setPadding = function(padding) {
        this.$padding = padding;
        this.content.style.padding = "0 " + padding + "px";
        this.$loop.schedule(this.CHANGE_FULL);
    };

    this.onScroll = function(e) {
        this.scrollToY(e.data);
    };

    this.$updateScrollBar = function() {
        this.scrollBar.setInnerHeight(this.session.getLength() * this.lineHeight);
        this.scrollBar.setScrollTop(this.scrollTop);
    };

    this.$renderChanges = function(changes) {
        if (!changes || !this.session || !this.$tokenizer)
            return;
        
        // text, scrolling and resize changes can cause the view port size to change
        if (!this.layerConfig ||
            changes & this.CHANGE_FULL ||
            changes & this.CHANGE_SIZE ||
            changes & this.CHANGE_TEXT ||
            changes & this.CHANGE_LINES ||
            changes & this.CHANGE_SCROLL
        )
            this.$computeLayerConfig();

        // full
        if (changes & this.CHANGE_FULL) {
            this.$textLayer.update(this.layerConfig);
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
            this.$markerLayer.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$updateScrollBar();
            return;
        }

        // scrolling
        if (changes & this.CHANGE_SCROLL) {
            if (changes & this.CHANGE_TEXT || changes & this.CHANGE_LINES)
                this.$textLayer.update(this.layerConfig);
            else
                this.$textLayer.scrollLines(this.layerConfig);
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
            this.$markerLayer.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$updateScrollBar();
            return;
        }

        if (changes & this.CHANGE_TEXT) {
            this.$textLayer.update(this.layerConfig);
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
        }
        else if (changes & this.CHANGE_LINES) {
            this.$updateLines();
            this.$updateScrollBar();
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
        } else if (changes & this.CHANGE_GUTTER) {
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
        }

        if (changes & this.CHANGE_CURSOR)
            this.$cursorLayer.update(this.layerConfig);

        if (changes & this.CHANGE_MARKER) {
            this.$markerLayer.update(this.layerConfig);
        }

        if (changes & this.CHANGE_SIZE)
            this.$updateScrollBar();
    };

    this.$computeLayerConfig = function() {
        var offset = this.scrollTop % this.lineHeight;
        var minHeight = this.$size.scrollerHeight + this.lineHeight;

        var longestLine = this.$getLongestLine();
        var widthChanged = !this.layerConfig ? true : (this.layerConfig.width != longestLine);

        var lineCount = Math.ceil(minHeight / this.lineHeight);
        var firstRow = Math.max(0, Math.round((this.scrollTop - offset) / this.lineHeight));
        var lastRow = Math.max(0, Math.min(this.session.getLength(), firstRow + lineCount) - 1);

        var layerConfig = this.layerConfig = {
            width : longestLine,
            padding : this.$padding,
            firstRow : firstRow,
            lastRow : lastRow,
            lineHeight : this.lineHeight,
            characterWidth : this.characterWidth,
            minHeight : minHeight,
            offset : offset,
            height : this.$size.scrollerHeight
        };

        this.$gutterLayer.element.style.marginTop = (-offset) + "px";
        this.content.style.marginTop = (-offset) + "px";
        this.content.style.width = longestLine + "px";
        this.content.style.height = minHeight + "px";
    };

    this.$updateLines = function() {
        var firstRow = this.$changedLines.firstRow;
        var lastRow = this.$changedLines.lastRow;
        this.$changedLines = null;

        var layerConfig = this.layerConfig;

        // if the update changes the width of the document do a full redraw
        if (layerConfig.width != this.$getLongestLine())
            return this.$textLayer.update(layerConfig);

        if (firstRow > layerConfig.lastRow + 1) { return; }
        if (lastRow < layerConfig.firstRow) { return; }

        // if the last row is unknown -> redraw everything
        if (lastRow === Infinity) {
            this.showGutter && this.$gutterLayer.update(layerConfig);
            this.$textLayer.update(layerConfig);
            return;
        }

        // else update only the changed rows
        this.$textLayer.updateLines(layerConfig, firstRow, lastRow);
    };

    this.$getLongestLine = function() {
        var charCount = this.session.getScreenWidth();
        if (this.$textLayer.showInvisibles)
            charCount += 1;

        return Math.max(this.$size.scrollerWidth - this.$padding * 2, Math.round(charCount * this.characterWidth));
    };

    this.addMarker = function(range, clazz, type) {
        var id = this.$markerLayer.addMarker(range, clazz, type);
        this.$loop.schedule(this.CHANGE_MARKER);
        return id;
    };

    this.removeMarker = function(markerId) {
        this.$markerLayer.removeMarker(markerId);
        this.$loop.schedule(this.CHANGE_MARKER);
    };

    this.addGutterDecoration = function(row, className){
        this.$gutterLayer.addGutterDecoration(row, className);
        this.$loop.schedule(this.CHANGE_GUTTER);
    }

    this.removeGutterDecoration = function(row, className){
        this.$gutterLayer.removeGutterDecoration(row, className);
        this.$loop.schedule(this.CHANGE_GUTTER);
    }

    this.setBreakpoints = function(rows) {
        this.$gutterLayer.setBreakpoints(rows);
        this.$loop.schedule(this.CHANGE_GUTTER);
    };

    this.updateCursor = function(position, overwrite) {
        this.$cursorLayer.setCursor(position, overwrite);
        this.$loop.schedule(this.CHANGE_CURSOR);
    };

    this.hideCursor = function() {
        this.$cursorLayer.hideCursor();
    };

    this.showCursor = function() {
        this.$cursorLayer.showCursor();
    };

    this.scrollCursorIntoView = function() {
        var pos = this.$cursorLayer.getPixelPosition();

        var left = pos.left + this.$padding;
        var top = pos.top;

        if (this.getScrollTop() > top) {
            this.scrollToY(top);
        }

        if (this.getScrollTop() + this.$size.scrollerHeight < top
                + this.lineHeight) {
            this.scrollToY(top + this.lineHeight - this.$size.scrollerHeight);
        }

        if (this.scroller.scrollLeft > left) {
            this.scrollToX(left);
        }

        if (this.scroller.scrollLeft + this.$size.scrollerWidth < left
                + this.characterWidth) {
            this.scrollToX(Math.round(left + this.characterWidth
                    - this.$size.scrollerWidth));
        }
    },

    this.getScrollTop = function() {
        return this.scrollTop;
    };

    this.getScrollLeft = function() {
        return this.scroller.scrollLeft;
    };

    this.getScrollTopRow = function() {
        return this.scrollTop / this.lineHeight;
    };

    this.scrollToRow = function(row) {
        this.scrollToY(row * this.lineHeight);
    };

    this.scrollToY = function(scrollTop) {
        var maxHeight = this.session.getLength() * this.lineHeight - this.$size.scrollerHeight;
        var scrollTop = Math.max(0, Math.min(maxHeight, scrollTop));

        if (this.scrollTop !== scrollTop) {
            this.scrollTop = scrollTop;
            this.$loop.schedule(this.CHANGE_SCROLL);
        }
    };

    this.scrollToX = function(scrollLeft) {
        if (scrollLeft <= this.$padding)
            scrollLeft = 0;

        this.scroller.scrollLeft = scrollLeft;
    };

    this.scrollBy = function(deltaX, deltaY) {
        deltaY && this.scrollToY(this.scrollTop + deltaY);
        deltaX && this.scrollToX(this.scroller.scrollLeft + deltaX);
    };

    this.screenToTextCoordinates = function(pageX, pageY) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var col = Math.round((pageX + this.scroller.scrollLeft - canvasPos.left - this.$padding)
                / this.characterWidth);
        var row = Math.floor((pageY + this.scrollTop - canvasPos.top)
                / this.lineHeight);

        return {
            row : row,
            column : this.session.screenToDocumentColumn(Math.max(0, Math.min(row, this.session.getLength()-1)), col)
        };
    };

    this.textToScreenCoordinates = function(row, column) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var x = this.$padding + Math.round(this.session.documentToScreenColumn(row, column) * this.characterWidth);
        var y = row * this.lineHeight;

        return {
            pageX: canvasPos.left + x - this.getScrollLeft(),
            pageY: canvasPos.top + y - this.getScrollTop()
        }
    };

    this.visualizeFocus = function() {
        dom.addCssClass(this.container, "ace_focus");
    };

    this.visualizeBlur = function() {
        dom.removeCssClass(this.container, "ace_focus");
    };

    this.showComposition = function(position) {
    };

    this.setCompositionText = function(text) {
    };

    this.hideComposition = function() {
    };

    this.setTheme = function(theme) {
        var _self = this;
        if (!theme || typeof theme == "string") {
            theme = theme || "ace/theme/textmate";
            require([theme], function(theme) {
                afterLoad(theme);
            });
        } else {
            afterLoad(theme);
        }

        var _self = this;
        function afterLoad(theme) {
            if (_self.$theme)
                dom.removeCssClass(_self.container, _self.$theme);

            _self.$theme = theme ? theme.cssClass : null;

            if (_self.$theme)
                dom.addCssClass(_self.container, _self.$theme);

            // force re-measure of the gutter width
            if (_self.$size) {
                _self.$size.width = 0;
                _self.onResize();
            }
        }
    };

}).call(VirtualRenderer.prototype);

exports.VirtualRenderer = VirtualRenderer;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/theme/textmate', function(require, exports, module) {

    var dom = require("pilot/dom");
    var cssText = require("text!ace/theme/tm.css");

    // import CSS once
    dom.importCssString(cssText);

    exports.cssClass = "ace-tm";
});
define("text!ace/theme/tm.css", ".ace-tm .ace_editor {" +
  "  border: 2px solid rgb(159, 159, 159);" +
  "}" +
  "" +
  ".ace-tm .ace_editor.ace_focus {" +
  "  border: 2px solid #327fbd;" +
  "}" +
  "" +
  ".ace-tm .ace_gutter {" +
  "  width: 50px;" +
  "  background: #e8e8e8;" +
  "  color: #333;" +
  "  overflow : hidden;" +
  "}" +
  "" +
  ".ace-tm .ace_gutter-layer {" +
  "  width: 100%;" +
  "  text-align: right;" +
  "}" +
  "" +
  ".ace-tm .ace_gutter-layer .ace_gutter-cell {" +
  "  padding-right: 6px;" +
  "}" +
  "" +
  ".ace-tm .ace_print_margin {" +
  "  width: 1px;" +
  "  background: #e8e8e8;" +
  "}" +
  "" +
  ".ace-tm .ace_text-layer {" +
  "  cursor: text;" +
  "}" +
  "" +
  ".ace-tm .ace_cursor {" +
  "  border-left: 2px solid black;" +
  "}" +
  "" +
  ".ace-tm .ace_cursor.ace_overwrite {" +
  "  border-left: 0px;" +
  "  border-bottom: 1px solid black;" +
  "}" +
  "        " +
  ".ace-tm .ace_line .ace_invisible {" +
  "  color: rgb(191, 191, 191);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_keyword {" +
  "  color: blue;" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_constant.ace_buildin {" +
  "  color: rgb(88, 72, 246);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_constant.ace_language {" +
  "  color: rgb(88, 92, 246);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_constant.ace_library {" +
  "  color: rgb(6, 150, 14);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_invalid {" +
  "  background-color: rgb(153, 0, 0);" +
  "  color: white;" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_support.ace_function {" +
  "  color: rgb(60, 76, 114);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_support.ace_constant {" +
  "  color: rgb(6, 150, 14);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_support.ace_type," +
  ".ace-tm .ace_line .ace_support.ace_class {" +
  "  color: rgb(109, 121, 222);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_keyword.ace_operator {" +
  "  color: rgb(104, 118, 135);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_string {" +
  "  color: rgb(3, 106, 7);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_comment {" +
  "  color: rgb(76, 136, 107);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_comment.ace_doc {" +
  "  color: rgb(0, 102, 255);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_comment.ace_doc.ace_tag {" +
  "  color: rgb(128, 159, 191);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_constant.ace_numeric {" +
  "  color: rgb(0, 0, 205);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_variable {" +
  "  color: rgb(49, 132, 149);" +
  "}" +
  "" +
  ".ace-tm .ace_line .ace_xml_pe {" +
  "  color: rgb(104, 104, 91);" +
  "}" +
  "" +
  ".ace-tm .ace_marker-layer .ace_selection {" +
  "  background: rgb(181, 213, 255);" +
  "}" +
  "" +
  ".ace-tm .ace_marker-layer .ace_step {" +
  "  background: rgb(252, 255, 0);" +
  "}" +
  "" +
  ".ace-tm .ace_marker-layer .ace_stack {" +
  "  background: rgb(164, 229, 101);" +
  "}" +
  "" +
  ".ace-tm .ace_marker-layer .ace_bracket {" +
  "  margin: -1px 0 0 -1px;" +
  "  border: 1px solid rgb(192, 192, 192);" +
  "}" +
  "" +
  ".ace-tm .ace_marker-layer .ace_active_line {" +
  "  background: rgb(232, 242, 254);" +
  "}" +
  "" +
  ".ace-tm .ace_string.ace_regex {" +
  "  color: rgb(255, 0, 0)   " +
  "}");

define("text!ace/css/editor.css", ".ace_editor {" +
  "  position: absolute;" +
  "  overflow: hidden;" +
  "" +
  "  font-family: \"Menlo\", \"Monaco\", \"Courier New\", monospace;" +
  "  font-size: 12px;  " +
  "}" +
  "" +
  ".ace_scroller {" +
  "  position: absolute;" +
  "  overflow-x: scroll;" +
  "  overflow-y: hidden;     " +
  "}" +
  "" +
  ".ace_gutter {" +
  "  position: absolute;" +
  "  overflow-x: hidden;" +
  "  overflow-y: hidden;" +
  "  height: 100%;" +
  "}" +
  "" +
  ".ace_editor .ace_sb {" +
  "  position: absolute;" +
  "  overflow-x: hidden;" +
  "  overflow-y: scroll;" +
  "  right: 0;" +
  "}" +
  "" +
  ".ace_editor .ace_sb div {" +
  "  position: absolute;" +
  "  width: 1px;" +
  "  left: 0px;" +
  "}" +
  "" +
  ".ace_editor .ace_print_margin {" +
  "  position: absolute;" +
  "  height: 100%;" +
  "}" +
  "" +
  ".ace_layer {" +
  "  z-index: 0;" +
  "  position: absolute;" +
  "  overflow: hidden;  " +
  "  white-space: nowrap;" +
  "  height: 100%;" +
  "  width: 100%;" +
  "}" +
  "" +
  ".ace_text-layer {" +
  "  font-family: Monaco, \"Courier New\", monospace;" +
  "  color: black;" +
  "}" +
  "" +
  ".ace_cursor-layer {" +
  "  cursor: text;" +
  "}" +
  "" +
  ".ace_cursor {" +
  "  z-index: 3;" +
  "  position: absolute;" +
  "}" +
  "" +
  ".ace_line {" +
  "  white-space: nowrap;" +
  "}" +
  "" +
  ".ace_marker-layer {" +
  "}" +
  "" +
  ".ace_marker-layer .ace_step {" +
  "  position: absolute;" +
  "  z-index: 2;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_selection {" +
  "  position: absolute;" +
  "  z-index: 3;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_bracket {" +
  "  position: absolute;" +
  "  z-index: 4;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_active_line {" +
  "  position: absolute;" +
  "  z-index: 1;" +
  "}");

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var deps = [ "pilot/fixoldbrowsers", "pilot/plugin_manager", "pilot/settings",
             "pilot/environment" ];

require(deps, function() {
    var catalog = require("pilot/plugin_manager").catalog;
    catalog.registerPlugins([ "pilot/index" ]);
});

var ace = {
    edit: function(el) {
        if (typeof(el) == "string") {
            el = document.getElementById(el);
        }
        var env = require("pilot/environment").create();
        var catalog = require("pilot/plugin_manager").catalog;
        catalog.startupPlugins({ env: env }).then(function() {
            var EditSession = require("ace/edit_session").EditSession;
            var JavaScriptMode = require("ace/mode/javascript").Mode;
            var UndoManager = require("ace/undomanager").UndoManager;
            var Editor = require("ace/editor").Editor;
            var Renderer = require("ace/virtual_renderer").VirtualRenderer;
            var theme = require("ace/theme/textmate");

            var doc = new EditSession(el.innerHTML);
            el.innerHTML = '';
            doc.setMode(new JavaScriptMode());
            doc.setUndoManager(new UndoManager());
            env.document = doc;
            env.editor = new Editor(new Renderer(el, theme));
            env.editor.setSession(doc);
            env.editor.resize();
            window.addEventListener("resize", function() {
                env.editor.resize();
            }, false);
            el.env = env;
        });
    }
};
