"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var http_1 = require('@angular/http');
var core_1 = require("@angular/core");
require('rxjs/add/operator/catch');
require('rxjs/add/operator/map');
require('rxjs/add/operator/toPromise');
var providerName = "APP_RESOURCES";
var ResourceService = (function () {
    function ResourceService(_http, res) {
        this._http = _http;
        this.res = res;
        this.propertyMapping = {};
        this.listAction = {
            url: "/",
            method: http_1.RequestMethod.Get
        };
        this.getAction = {
            url: "/:id",
            method: http_1.RequestMethod.Get
        };
        this.insertAction = {
            url: "/",
            method: http_1.RequestMethod.Post
        };
        this.updateAction = {
            url: "/:id",
            method: http_1.RequestMethod.Put
        };
        this.deleteAction = {
            url: "/:id",
            method: http_1.RequestMethod.Delete
        };
        this.basePath = res.basePath ? res.basePath : res.name;
        this.propertyMapping = res.propertyMapping;
        Object.assign(this.listAction, res.listAction);
        Object.assign(this.getAction, res.getAction);
        Object.assign(this.insertAction, res.insertAction);
        Object.assign(this.updateAction, res.updateAction);
        Object.assign(this.deleteAction, res.deleteAction);
    }
    ResourceService.prototype.list = function () {
        var request = this._initRequest(this.listAction);
        return this._executeRequest(request);
    };
    ResourceService.prototype.get = function (data) {
        var obj;
        if (typeof data == "number") {
            obj = { id: data };
        }
        else {
            obj = data;
        }
        var request = this._initRequest(this.getAction, obj);
        return this._executeRequest(request);
    };
    ResourceService.prototype.delete = function (data) {
        var obj;
        if (typeof data == "number") {
            obj = { id: data };
        }
        else {
            obj = data;
        }
        var request = this._initRequest(this.deleteAction, obj);
        return this._executeRequest(request);
    };
    ResourceService.prototype.insert = function (data) {
        var request = this._initRequest(this.insertAction, data);
        return this._executeRequest(request);
    };
    ResourceService.prototype.update = function (data) {
        var request = this._initRequest(this.updateAction, data);
        return this._executeRequest(request);
    };
    ResourceService.prototype.save = function (data) {
        if (this._isUpdateAction(data)) {
            return this.update(data);
        }
        else {
            return this.insert(data);
        }
    };
    ResourceService.prototype._initRequest = function (request, obj) {
        var _this = this;
        var _request = Object.assign({}, request);
        var path = "/" + this.basePath + (_request.url.startsWith("/") ? "" : "/") + _request.url;
        if (obj) {
            var parts = path.split("/");
            parts.forEach(function (part) {
                if (part.startsWith(":")) {
                    var value = _this._findValueByMap(obj, part);
                    if (value) {
                        path = path.replace(part, value.toString());
                    }
                }
            });
            if ([http_1.RequestMethod.Patch, http_1.RequestMethod.Post, http_1.RequestMethod.Put, "PATCH", "POST", "PUT"].indexOf(_request.method) >= 0) {
                _request.body = obj;
            }
        }
        _request.url = path;
        return _request;
    };
    ResourceService.prototype._executeRequest = function (request) {
        var o = this._http.request("", request);
        return new ResourceResult(o);
    };
    ResourceService.prototype._findValueByMap = function (obj, part) {
        var key = part.substring(1, part.length);
        var newKey = this.propertyMapping[key];
        return newKey ? obj[newKey] : obj[key];
    };
    ResourceService.prototype._isUpdateAction = function (data) {
        var isUpdate = true;
        var parts = this.updateAction.url.split("/");
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.startsWith(":")) {
                var value = this._findValueByMap(data, part);
                if (!value || value.toString().length == 0) {
                    isUpdate = false;
                    break;
                }
            }
        }
        return isUpdate;
    };
    return ResourceService;
}());
exports.ResourceService = ResourceService;
var ResourceFactory = (function () {
    function ResourceFactory(http, appResources) {
        this.http = http;
        this.resources = {};
        this.createAll(appResources);
    }
    ResourceFactory.prototype.create = function (res) {
        var _res = new ResourceService(this.http, res);
        this.resources[res.name] = _res;
    };
    ResourceFactory.prototype.createAll = function (resources) {
        var _this = this;
        resources.forEach(function (res) {
            _this.create(res);
        });
    };
    ResourceFactory.prototype.get = function (name) {
        if (this.resources[name]) {
            return this.resources[name];
        }
        else {
            throw new Error("Resource with name '" + name + "' not found!");
        }
    };
    ResourceFactory = __decorate([
        core_1.Injectable(),
        __param(1, core_1.Inject(providerName)), 
        __metadata('design:paramtypes', [http_1.Http, Array])
    ], ResourceFactory);
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
var ResourceResult = (function () {
    function ResourceResult($o) {
        this._$o = $o;
    }
    Object.defineProperty(ResourceResult.prototype, "$o", {
        get: function () {
            return this._$o;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResourceResult.prototype, "$d", {
        get: function () {
            return this._$o.map(function (r) { return r.json(); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResourceResult.prototype, "$p", {
        get: function () {
            return this._$o.toPromise();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResourceResult.prototype, "$s", {
        get: function () {
            return this.$d.toPromise();
        },
        enumerable: true,
        configurable: true
    });
    return ResourceResult;
}());
exports.ResourceResult = ResourceResult;
function provideResources(config) {
    return { provide: providerName, useValue: config };
}
exports.provideResources = provideResources;
//# sourceMappingURL=index.js.map