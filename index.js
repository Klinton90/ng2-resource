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
exports.RESOURCES_PROVIDER_NAME = "APP_RESOURCES";
exports.DEFAULT_RESOURCE_NAME = "DEFAULT";
var ResourceService = (function () {
    function ResourceService(_http, res) {
        this._http = _http;
        this.res = res;
        this.isRelative = false;
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
        this.name = res.name;
        this.basePath = res.basePath ? res.basePath : res.name;
        if (res.headers) {
            this.headers = res.headers;
        }
        if (res.isRelative != null) {
            this.isRelative = res.isRelative;
        }
        if (res.propertyMapping) {
            this.propertyMapping = res.propertyMapping;
        }
        this.requestInterceptor = res.requestInterceptor;
        this.resultInterceptor = res.resultInterceptor;
        Object.assign(this.listAction, res.listAction);
        Object.assign(this.getAction, res.getAction);
        Object.assign(this.insertAction, res.insertAction);
        Object.assign(this.updateAction, res.updateAction);
        Object.assign(this.deleteAction, res.deleteAction);
    }
    ResourceService.prototype.list = function (overrides) {
        return this._executeRequest(this.listAction, null, overrides);
    };
    ResourceService.prototype.get = function (data, overrides) {
        if (!this._isObjectOrNumber(data)) {
            throw new Error("Data must be Object or Integer");
        }
        var obj = this._isNumber(data) ? { id: data } : data;
        return this._executeRequest(this.getAction, obj, overrides);
    };
    ResourceService.prototype.delete = function (data, overrides) {
        if (!this._isObjectOrNumber(data)) {
            throw new Error("Data must be Object or Integer");
        }
        var obj = this._isNumber(data) ? { id: data } : data;
        return this._executeRequest(this.deleteAction, obj, overrides);
    };
    ResourceService.prototype.insert = function (data, overrides) {
        if (!this._isObject(data)) {
            throw new Error("Data must be Object");
        }
        return this._executeRequest(this.insertAction, data, overrides);
    };
    ResourceService.prototype.update = function (data, overrides) {
        if (!this._isObject(data)) {
            throw new Error("Data must be Object");
        }
        return this._executeRequest(this.updateAction, data, overrides);
    };
    ResourceService.prototype.save = function (data, overrides) {
        if (this._isUpdateAction(data)) {
            return this.update(data, overrides);
        }
        else {
            return this.insert(data, overrides);
        }
    };
    ResourceService.prototype._executeRequest = function (request, obj, overrides) {
        var _request = Object.assign({}, request);
        if (overrides) {
            _request = Object.assign(_request, overrides);
        }
        this._preparePath(_request, obj);
        this._mergeHeaders(_request);
        if (obj && [http_1.RequestMethod.Patch, http_1.RequestMethod.Post, http_1.RequestMethod.Put, "PATCH", "POST", "PUT"].indexOf(request.method) >= 0) {
            _request.body = obj;
        }
        if (this.requestInterceptor) {
            _request = this.requestInterceptor(_request);
        }
        if (_request.requestInterceptor) {
            _request = _request.requestInterceptor(_request);
        }
        var o = this._http.request("", _request);
        var i = _request.resultInterceptor ? _request.resultInterceptor : this.resultInterceptor;
        return new ResourceResult(o, i);
    };
    ResourceService.prototype._preparePath = function (request, obj) {
        var _this = this;
        var path = this.basePath;
        if (this.isRelative) {
            if (path.startsWith("/")) {
                path = path.substring(1, path.length);
            }
        }
        else {
            if (!this.basePath.startsWith("/") && !this.basePath.startsWith("http")) {
                path = "/" + path;
            }
        }
        path += (!path.endsWith("/") && !request.url.startsWith("/") ? "/" : "") + request.url;
        path.replace("//", "/");
        var parts = path.split("/");
        parts.forEach(function (part) {
            if (part.startsWith(":")) {
                var value = _this._findValueByMap(obj, part);
                if (value) {
                    path = path.replace(part, value.toString());
                }
                else {
                    throw new Error("Cannot resolve parameter '" + part + "' in request '" + _this.name + "'");
                }
            }
        });
        request.url = path;
    };
    ResourceService.prototype._findValueByMap = function (obj, part) {
        var result;
        if (obj) {
            var key = part.substring(1, part.length);
            var newKey = this.propertyMapping[key];
            result = newKey ? obj[newKey] : obj[key];
        }
        return result;
    };
    ResourceService.prototype._isUpdateAction = function (data) {
        var isUpdate = true;
        var parts = this.updateAction.url.split("/");
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.startsWith(":")) {
                var value = this._findValueByMap(data, part);
                if (!value || value.toString().length == 0 || value.toString() == "0") {
                    isUpdate = false;
                    break;
                }
            }
        }
        return isUpdate;
    };
    ResourceService.prototype._mergeHeaders = function (_request) {
        if (this.headers) {
            this.headers.forEach(function (values, name) {
                for (var i = 0; i < values.length; i++) {
                    _request.headers.append(name, values[i]);
                }
            });
        }
    };
    ResourceService.prototype._isObject = function (data) {
        return typeof data === 'object';
    };
    ResourceService.prototype._isNumber = function (data) {
        return typeof data === 'number';
    };
    ResourceService.prototype._isObjectOrNumber = function (data) {
        return this._isObject(data) || this._isNumber(data);
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
        if (res.name == exports.DEFAULT_RESOURCE_NAME) {
            this.defaultConfig = res;
        }
        else {
            if (this.defaultConfig != null) {
                var newRes = Object.assign({}, this.defaultConfig);
                res = Object.assign(newRes, res);
            }
            this.resources[res.name] = new ResourceService(this.http, res);
        }
    };
    ResourceFactory.prototype.createAll = function (resources) {
        var _this = this;
        var defaultConfigInd = resources.findIndex(function (value) {
            return value.name == exports.DEFAULT_RESOURCE_NAME;
        });
        if (defaultConfigInd > -1) {
            this.defaultConfig = resources[defaultConfigInd];
            resources.splice(defaultConfigInd, 1);
        }
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
        __param(1, core_1.Inject(exports.RESOURCES_PROVIDER_NAME)), 
        __metadata('design:paramtypes', [http_1.Http, Array])
    ], ResourceFactory);
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
var ResourceResult = (function () {
    function ResourceResult($o, $i) {
        this._$o = $o;
        this._$i = $i;
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
    Object.defineProperty(ResourceResult.prototype, "$i", {
        get: function () {
            return this._$i ? this._$i(this._$o) : this._$o;
        },
        enumerable: true,
        configurable: true
    });
    return ResourceResult;
}());
exports.ResourceResult = ResourceResult;
function provideResources(config) {
    return [
        { provide: exports.RESOURCES_PROVIDER_NAME, useValue: config },
        ResourceFactory
    ];
}
exports.provideResources = provideResources;
//# sourceMappingURL=index.js.map