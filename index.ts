import {Http, RequestMethod, RequestOptionsArgs, Response, URLSearchParams, Headers} from '@angular/http';
import {Injectable, Inject} from "@angular/core";
import {Observable} from 'rxjs/Rx';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

export const RESOURCES_PROVIDER_NAME = "RESOURCES_PROVIDER_NAME";
export const DEFAULT_RESOURCE_NAME = "DEFAULT_RESOURCE_NAME";
export const BASE_RESOURCE_NAME = "BASE_RESOURCE_NAME";

export class ResourceService implements ResourceConfig{

    public name: string;
    public basePath: string;
    public headers: Headers;
    public isRelative: boolean = false;
    public withCredentials: boolean = false;
    public propertyMapping: Map<string, string> = new Map<string, string>();
    public requestInterceptor: RequestInterceptor;
    public resultInterceptor: ResultInterceptor;

    public listAction: RequestAction = {
        url: "/",
        method: RequestMethod.Get
    };
    public getAction: RequestAction = {
        url: "/:id",
        method: RequestMethod.Get
    };
    public insertAction: RequestAction = {
        url: "/",
        method: RequestMethod.Post
    };
    public updateAction: RequestAction = {
        url: "/:id",
        method: RequestMethod.Put
    };
    public deleteAction: RequestAction = {
        url: "/:id",
        method: RequestMethod.Delete
    };

    constructor(protected _http: Http, protected res: ResourceConfig){
        this.name = res.name;
        this.basePath = res.basePath == null ? res.name : res.basePath;
        if(res.headers){
            this.headers = res.headers;
        }
        if(res.isRelative != null){
            this.isRelative = res.isRelative;
        }
        if(res.withCredentials != null){
            this.withCredentials = res.withCredentials;
        }
        if(res.propertyMapping){
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

    public list(overrides?: RequestAction): ResourceResult{
        return this._executeRequest(this.listAction, null, overrides);
    }

    public get(data: Object, overrides?: RequestAction): ResourceResult;
    public get(data: number, overrides?: RequestAction): ResourceResult{
        if(!this._isObjectOrNumber(data)){
            throw new Error("Data must be Object or Integer");
        }
        let obj = this._isNumber(data) ? {id: data} : data;
        return this._executeRequest(this.getAction, obj, overrides);
    }

    public delete(data: Object, overrides?: RequestAction): ResourceResult;
    public delete(data: number, overrides?: RequestAction): ResourceResult{
        if(!this._isObjectOrNumber(data)){
            throw new Error("Data must be Object or Integer");
        }
        let obj = this._isNumber(data) ? {id: data} : data;
        return this._executeRequest(this.deleteAction, obj, overrides);
    }

    public insert(data: Object, overrides?: RequestAction): ResourceResult{
        if(!this._isObject(data)){
            throw new Error("Data must be Object");
        }
        return this._executeRequest(this.insertAction, data, overrides);
    }

    public update(data: Object, overrides?: RequestAction): ResourceResult{
        if(!this._isObject(data)){
            throw new Error("Data must be Object");
        }
        return this._executeRequest(this.updateAction, data, overrides);
    }

    public save(data: Object, overrides?: RequestAction): ResourceResult{
        if(this._isUpdateAction(data)){
            return this.update(data, overrides);
        }else{
            return this.insert(data, overrides);
        }
    }

    public request(request: RequestAction, obj?: Object): ResourceResult{
        return this._executeRequest(request, obj);
    }

    protected _executeRequest(request: RequestAction, obj?: Object, overrides?: RequestAction): ResourceResult{
        let _request: RequestAction = Object.assign({}, request, overrides);

        if(_request.method == null){
            throw Error("Request parameter `method` is required.");
        }

        _request.url = this._preparePath(_request, obj);
        ResourceService.mergeHeaders(this, _request);
        if(obj && [RequestMethod.Patch, RequestMethod.Post, RequestMethod.Put, "PATCH", "POST", "PUT"].indexOf(request.method) >= 0){
            _request.body = obj;
        }
        if(this.requestInterceptor){
            _request = this.requestInterceptor(_request);
        }
        if(_request.requestInterceptor){
            _request = _request.requestInterceptor(_request);
        }
        if(_request.withCredentials == null && this.withCredentials){
            _request.withCredentials = this.withCredentials;
        }

        let o: Observable<Response> = this._http.request("", _request);
        let i: ResultInterceptor = _request.resultInterceptor ? _request.resultInterceptor : this.resultInterceptor;
        return new ResourceResult(o, i);
    }

    protected _preparePath(request: RequestAction, obj?: Object): string{
        let path: string = this.basePath;
        let url: string = request.url;
        path.replace("\\", "/");
        url.replace("\\", "/");
        if(this.isRelative){
            if(path.startsWith("/")){
                path = path.substring(1, path.length);
            }
        }else{
            if(!this.basePath.startsWith("/") && !this.basePath.startsWith("http")){
                path = "/" + path;
            }
        }
        path += (!path.endsWith("/") && !url.startsWith("/") ? "/" : "") + url;
        path.replace("//", "/");

        let parts: string[] = path.split("/");
        parts.forEach((part: string) => {
            if(part.startsWith(":")){
                let value: any = this._findValueByMap(obj, part);
                if(value){
                    path = path.replace(part, value.toString());
                }else{
                    throw new Error("Cannot resolve parameter '" + part + "' in request '" + this.name + "'");
                }
            }
        });

        return path;
    }

    protected _findValueByMap(obj: Object, part: string): any{
        let result: any;
        if(obj){
            let key: string = part.substring(1, part.length);
            let newKey: string = this.propertyMapping[key];
            result = newKey ? obj[newKey] : obj[key];
        }
        return result;
    }

    protected _isUpdateAction(data: Object): boolean{
        let isUpdate: boolean = true;
        let parts: string[] = this.updateAction.url.split("/");
        for(let i: number = 0; i < parts.length; i++){
            let part: string = parts[i];
            if(part.startsWith(":")){
                let value: any = this._findValueByMap(data, part);
                if(!value || value.toString().length == 0 || value.toString() == "0"){
                    isUpdate = false;
                    break;
                }
            }
        }

        return isUpdate;
    }

    public static mergeHeaders(from: RequestAction, to: RequestAction): void{
        if(from.headers){
            to.headers = to.headers || new Headers();
            from.headers.forEach((values: string[], name: string) => {
                for(let i = 0; i < values.length; i++){
                    to.headers.append(name, values[i]);
                }
            });
        }
    }

    protected _isObject(data: any): boolean{
        return typeof data === 'object';
    }

    protected _isNumber(data: any): boolean{
        return typeof data === 'number';
    }

    protected _isObjectOrNumber(data: any): boolean{
        return this._isObject(data) || this._isNumber(data);
    }
}

@Injectable()
export class ResourceFactory{

    protected resources: Map<string, ResourceService> = new Map<string, ResourceService>();
    public defaultConfig: ResourceConfig;
    public baseConfig: ResourceConfig;

    constructor(public http: Http, @Inject(RESOURCES_PROVIDER_NAME) appResources: ResourceConfig[]){
        this.createAll(appResources);
    }

    public create(res: ResourceConfig): void{
        let _res = this.defaultConfig != null ? Object.assign({}, this.defaultConfig, res) : res;
        let service: ResourceService = new ResourceService(this.http, _res);
        this._mergeBasePath(service);
        this.resources[res.name] = service;
    }

    public createAll(resources: ResourceConfig[]): void{
        let mergeConfigIndex: number = resources.findIndex((value: ResourceConfig) => {
            return value.name == BASE_RESOURCE_NAME;
        });
        if(mergeConfigIndex > -1){
            this.baseConfig = resources[mergeConfigIndex];
            let _baseConfig = Object.assign({}, this.baseConfig);
            _baseConfig.basePath = _baseConfig.basePath == null ? "" : _baseConfig.basePath;
            resources.splice(mergeConfigIndex, 1);
            this.resources[BASE_RESOURCE_NAME] = new ResourceService(this.http, _baseConfig);
        }

        let defaultConfigIndex: number = resources.findIndex((value: ResourceConfig) => {
            return value.name == DEFAULT_RESOURCE_NAME;
        });
        if(defaultConfigIndex > -1){
            this.defaultConfig = resources[defaultConfigIndex];
            resources.splice(defaultConfigIndex, 1);
            ResourceFactory._mergeConfig(this.baseConfig, this.defaultConfig);

            let _defaultConfig = Object.assign({}, this.defaultConfig);
            _defaultConfig.basePath = _defaultConfig.basePath == null ? "" : _defaultConfig.basePath;

            let service: ResourceService =new ResourceService(this.http, _defaultConfig);
            this._mergeBasePath(service);
            this.resources[DEFAULT_RESOURCE_NAME] = service;
        }

        resources.forEach((res: ResourceConfig) => {
            this.create(res);
        });
    }

    public get(name: string): ResourceService{
        if(this.resources[name]){
            return this.resources[name];
        }else{
            throw new Error("Resource with name '" + name + "' not found!");
        }
    }

    private _mergeBasePath(service: ResourceService): void{
        if(this.baseConfig.basePath){
            this.baseConfig.basePath.replace("\\", "/");
            let separator: string = !service.basePath.startsWith("/") && !this.baseConfig.basePath.endsWith("/") ? "/" : "";
            service.basePath = this.baseConfig.basePath + separator + service.basePath;
        }
    }

    private static _mergeConfig(from: ResourceConfig, to: ResourceConfig): void{
        if(from){
            ResourceFactory._replaceParam(from, to, "isRelative");
            ResourceFactory._replaceParam(from, to, "withCredentials");

            ResourceFactory._mergeAction(from.listAction, to.listAction);
            ResourceFactory._mergeAction(from.getAction, to.getAction);
            ResourceFactory._mergeAction(from.insertAction, to.insertAction);
            ResourceFactory._mergeAction(from.updateAction, to.updateAction);
            ResourceFactory._mergeAction(from.deleteAction, to.deleteAction);

            ResourceService.mergeHeaders(from, to);
            ResourceFactory._copyRequestInterceptor(from, to);
            ResourceFactory._copyResultInterceptor(from, to);

            if(from.propertyMapping){
                if(to.propertyMapping == null){
                    to.propertyMapping = from.propertyMapping;
                }else{
                    to.propertyMapping = Object.assign({}, from.propertyMapping, to.propertyMapping);
                }
            }
        }
    }

    private static _mergeAction(from: RequestAction, to: RequestAction): void{
        if(from){
            ResourceFactory._replaceParam(from, to, "url");
            ResourceFactory._replaceParam(from, to, "method");
            ResourceFactory._replaceParam(from, to, "withCredentials");
            ResourceFactory._replaceParam(from, to, "responseType");
            //cannot properly merge `body, as type is `any`
            ResourceFactory._replaceParam(from, to, "body");

            ResourceService.mergeHeaders(from, to);
            ResourceFactory._copyRequestInterceptor(from, to);
            ResourceFactory._copyResultInterceptor(from, to);

            if(from.params != null){
                if(to.params == null){
                    to.params = from.params;
                }else{
                    if(to.params instanceof URLSearchParams && from.params instanceof URLSearchParams){
                        (<URLSearchParams>to.params).appendAll(from.params);
                    }else if(to.params instanceof Map && from.params instanceof Map){
                        to.params = Object.assign({}, from.params, to.params);
                    }
                }
            }
        }
    }

    private static _replaceParam(from: any, to: any, param: string): void{
        to[param] = to[param] == null && from[param] != null ? from[param] : to[param];
    }

    private static _copyRequestInterceptor(from: ResourceConfig | RequestAction, to: ResourceConfig | RequestAction){
        if(from.requestInterceptor != null){
            if(to.requestInterceptor == null){
                to.requestInterceptor = from.requestInterceptor;
            }else{
                let copy = to.requestInterceptor;
                to.requestInterceptor = function(request: RequestOptionsArgs): RequestOptionsArgs{
                    request = from.requestInterceptor(request);
                    return copy(request);
                }
            }
        }
    }

    private static _copyResultInterceptor(from: ResourceConfig | RequestAction, to: ResourceConfig | RequestAction){
        if(from.resultInterceptor != null){
            if(to.resultInterceptor == null){
                to.resultInterceptor = from.resultInterceptor;
            }else{
                let copy = to.resultInterceptor;
                to.resultInterceptor = function(o: Observable<Response>): Observable<any>{
                    return copy(from.resultInterceptor(o));
                }
            }
        }
    }

}

export interface RequestInterceptor{
    (request: RequestOptionsArgs): RequestOptionsArgs;
}

export interface ResultInterceptor{
    (o: Observable<Response>): Observable<any>;
}

export interface RequestAction extends RequestOptionsArgs{
    requestInterceptor?: RequestInterceptor;
    resultInterceptor?: ResultInterceptor;
}

export interface ResourceConfig{
    name: string;
    basePath?: string;
    headers?: Headers;
    isRelative?: boolean;
    withCredentials?: boolean;
    listAction?: RequestAction;
    getAction?: RequestAction;
    insertAction?: RequestAction;
    updateAction?: RequestAction;
    deleteAction?: RequestAction;
    propertyMapping?: Map<string, string>;
    requestInterceptor?: RequestInterceptor;
    resultInterceptor?: ResultInterceptor;
}

export class ResourceResult{
    protected _$o: Observable<Response>;

    protected _interceptor: ResultInterceptor;

    get $o(): Observable<Response>{
        return this._$o;
    }

    get $od(): Observable<any>{
        return this._$o.map((r: Response) => r.json());
    }

    get $p(): Promise<Response>{
        return this._$o.toPromise();
    }

    get $pd(): Promise<any>{
        return this.$od.toPromise();
    }

    get $oi(): Observable<any>{
        return this._interceptor ? this._interceptor(this._$o) : this._$o;
    }

    get $pi(): Promise<any>{
        return this.$oi.toPromise();
    }

    constructor($o: Observable<Response>, interceptor?: ResultInterceptor){
        this._$o = $o.share();
        this._interceptor = interceptor;
    }
}

export function provideResources(config: ResourceConfig[]): any{
    return [
        {provide: RESOURCES_PROVIDER_NAME, useValue: config},
        ResourceFactory
    ];
}