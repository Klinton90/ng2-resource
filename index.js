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
var http_1 = require("@angular/http");
var core_1 = require("@angular/core");
require("rxjs/add/operator/catch");
require("rxjs/add/operator/map");
require("rxjs/add/operator/toPromise");
exports.RESOURCES_PROVIDER_NAME = "RESOURCES_PROVIDER_NAME";
exports.DEFAULT_RESOURCE_NAME = "DEFAULT_RESOURCE_NAME";
exports.MERGE_RESOURCE_NAME = "MERGE_RESOURCE_NAME";
var ResourceService = (function () {
    function ResourceService(_http, res) {
        this._http = _http;
        this.res = res;
        this.isRelative = false;
        this.propertyMapping = new Map();
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
        this.basePath = res.basePath == null ? res.name : res.basePath;
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
    ResourceService.prototype.request = function (request, obj) {
        return this._executeRequest(request, obj);
    };
    ResourceService.prototype._executeRequest = function (request, obj, overrides) {
        var _request = Object.assign({}, request, overrides);
        this._preparePath(_request, obj);
        ResourceService.mergeHeaders(this, _request);
        if (obj && [http_1.RequestMethod.Patch, http_1.RequestMethod.Post, http_1.RequestMethod.Put, "PATCH", "POST", "PUT"].indexOf(request.method) >= 0) {
            _request.body = obj;
        }
        if (this.requestInterceptor) {
            _request = this.requestInterceptor(_request);
        }
        if (_request.requestInterceptor) {
            _request = _request.requestInterceptor(_request);
        }
        if (_request.method == null) {
            throw Error("Request parameter `method` is required.");
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
    ResourceService.mergeHeaders = function (from, to) {
        if (from.headers) {
            to.headers = to.headers || new http_1.Headers();
            from.headers.forEach(function (values, name) {
                for (var i = 0; i < values.length; i++) {
                    to.headers.append(name, values[i]);
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
var ResourceFactory = ResourceFactory_1 = (function () {
    function ResourceFactory(http, appResources) {
        this.http = http;
        this.resources = new Map();
        this.createAll(appResources);
    }
    ResourceFactory.prototype.create = function (res) {
        var _res = this.defaultConfig != null ? Object.assign({}, this.defaultConfig, res) : res;
        var service = new ResourceService(this.http, _res);
        if (this.mergeConfig.basePath) {
            service.basePath = this.mergeConfig.basePath + service.basePath;
        }
        this.resources[res.name] = service;
    };
    ResourceFactory.prototype.createAll = function (resources) {
        var _this = this;
        var mergeConfigIndex = resources.findIndex(function (value) {
            return value.name == exports.MERGE_RESOURCE_NAME;
        });
        if (mergeConfigIndex > -1) {
            this.mergeConfig = resources[mergeConfigIndex];
            var _mergeConfig = Object.assign({}, this.mergeConfig);
            _mergeConfig.basePath = _mergeConfig.basePath == null ? "" : _mergeConfig.basePath;
            resources.splice(mergeConfigIndex, 1);
            this.resources[exports.MERGE_RESOURCE_NAME] = new ResourceService(this.http, _mergeConfig);
        }
        var defaultConfigIndex = resources.findIndex(function (value) {
            return value.name == exports.DEFAULT_RESOURCE_NAME;
        });
        if (defaultConfigIndex > -1) {
            this.defaultConfig = resources[defaultConfigIndex];
            resources.splice(defaultConfigIndex, 1);
            ResourceFactory_1._mergeConfig(this.mergeConfig, this.defaultConfig);
            var _defaultConfig = Object.assign({}, this.defaultConfig);
            _defaultConfig.basePath = _defaultConfig.basePath == null ? "" : _defaultConfig.basePath;
            var service = new ResourceService(this.http, _defaultConfig);
            if (this.mergeConfig.basePath) {
                service.basePath = this.mergeConfig.basePath + service.basePath;
            }
            this.resources[exports.DEFAULT_RESOURCE_NAME] = service;
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
    ResourceFactory._mergeConfig = function (from, to) {
        if (from) {
            ResourceFactory_1._replaceParam(from, to, "isRelative");
            ResourceFactory_1._mergeAction(from.listAction, to.listAction);
            ResourceFactory_1._mergeAction(from.getAction, to.getAction);
            ResourceFactory_1._mergeAction(from.insertAction, to.insertAction);
            ResourceFactory_1._mergeAction(from.updateAction, to.updateAction);
            ResourceFactory_1._mergeAction(from.deleteAction, to.deleteAction);
            ResourceService.mergeHeaders(from, to);
            ResourceFactory_1._copyRequestInterceptor(from, to);
            ResourceFactory_1._copyResultInterceptor(from, to);
            if (from.propertyMapping) {
                if (to.propertyMapping == null) {
                    to.propertyMapping = from.propertyMapping;
                }
                else {
                    to.propertyMapping = Object.assign({}, from.propertyMapping, to.propertyMapping);
                }
            }
        }
    };
    ResourceFactory._mergeAction = function (from, to) {
        if (from) {
            ResourceFactory_1._replaceParam(from, to, "url");
            ResourceFactory_1._replaceParam(from, to, "method");
            ResourceFactory_1._replaceParam(from, to, "withCredentials");
            ResourceFactory_1._replaceParam(from, to, "responseType");
            //cannot properly merge `body, as type is `any`
            ResourceFactory_1._replaceParam(from, to, "body");
            ResourceService.mergeHeaders(from, to);
            ResourceFactory_1._copyRequestInterceptor(from, to);
            ResourceFactory_1._copyResultInterceptor(from, to);
            if (from.params != null) {
                if (to.params == null) {
                    to.params = from.params;
                }
                else {
                    if (to.params instanceof http_1.URLSearchParams && from.params instanceof http_1.URLSearchParams) {
                        to.params.appendAll(from.params);
                    }
                    else if (to.params instanceof Map && from.params instanceof Map) {
                        to.params = Object.assign({}, from.params, to.params);
                    }
                }
            }
        }
    };
    ResourceFactory._replaceParam = function (from, to, param) {
        to[param] = to[param] == null && from[param] != null ? to[param] : from[param];
    };
    ResourceFactory._copyRequestInterceptor = function (from, to) {
        if (from.requestInterceptor != null) {
            if (to.requestInterceptor == null) {
                to.requestInterceptor = from.requestInterceptor;
            }
            else {
                var copy_1 = to.requestInterceptor;
                to.requestInterceptor = function (request) {
                    request = from.requestInterceptor(request);
                    return copy_1(request);
                };
            }
        }
    };
    ResourceFactory._copyResultInterceptor = function (from, to) {
        if (from.resultInterceptor != null) {
            if (to.resultInterceptor == null) {
                to.resultInterceptor = from.resultInterceptor;
            }
            else {
                var copy_2 = to.resultInterceptor;
                to.resultInterceptor = function (o) {
                    return copy_2(from.resultInterceptor(o));
                };
            }
        }
    };
    return ResourceFactory;
}());
ResourceFactory = ResourceFactory_1 = __decorate([
    core_1.Injectable(),
    __param(1, core_1.Inject(exports.RESOURCES_PROVIDER_NAME)),
    __metadata("design:paramtypes", [http_1.Http, Array])
], ResourceFactory);
exports.ResourceFactory = ResourceFactory;
var ResourceResult = (function () {
    function ResourceResult($o, interceptor) {
        this._$o = $o.share();
        this._interceptor = interceptor;
    }
    Object.defineProperty(ResourceResult.prototype, "$o", {
        get: function () {
            return this._$o;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResourceResult.prototype, "$od", {
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
    Object.defineProperty(ResourceResult.prototype, "$pd", {
        get: function () {
            return this.$od.toPromise();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResourceResult.prototype, "$oi", {
        get: function () {
            return this._interceptor ? this._interceptor(this._$o) : this._$o;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ResourceResult.prototype, "$pi", {
        get: function () {
            return this.$oi.toPromise();
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
var ResourceFactory_1;
//# sourceMappingURL=index.js.map