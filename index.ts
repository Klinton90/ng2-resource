import {Http, RequestMethod, RequestOptionsArgs, Response, URLSearchParams, Headers} from '@angular/http';
import {Injectable, Inject} from "@angular/core";
import {Observable} from 'rxjs/Rx';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

export const RESOURCES_PROVIDER_NAME = "APP_RESOURCES";
export const DEFAULT_RESOURCE_NAME = "DEFAULT";

export class ResourceService implements ResourceConfig{

    public name: string;
    public basePath: string;
    public headers: Headers;
    public isRelative: boolean = false;
    public propertyMapping: { [id: string]: string; } = {};
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
        this.basePath = res.basePath ? res.basePath : res.name;
        if(res.headers){
            this.headers = res.headers;
        }
        if(res.isRelative != null){
            this.isRelative = res.isRelative;
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

    protected _executeRequest(request: RequestAction, obj?: Object, overrides?: RequestAction): ResourceResult{
        let _request: RequestAction = Object.assign({}, request);
        if(overrides){
            _request = Object.assign(_request, overrides);
        }

        this._preparePath(_request, obj);
        this._mergeHeaders(_request);
        if(obj && [RequestMethod.Patch, RequestMethod.Post, RequestMethod.Put, "PATCH", "POST", "PUT"].indexOf(request.method) >= 0){
            _request.body = obj;
        }
        if(this.requestInterceptor){
            _request = this.requestInterceptor(_request);
        }
        if(_request.requestInterceptor){
            _request = _request.requestInterceptor(_request);
        }

        let o: Observable<Response> = this._http.request("", _request);
        let i: ResultInterceptor = _request.resultInterceptor ? _request.resultInterceptor : this.resultInterceptor;
        return new ResourceResult(o, i);
    }

    protected _preparePath(request: RequestAction, obj?: Object): void{
        let path: string = this.basePath;
        if(this.isRelative){
            if(path.startsWith("/")){
                path = path.substring(1, path.length);
            }
        }else{
            if(!this.basePath.startsWith("/") && !this.basePath.startsWith("http")){
                path = "/" + path;
            }
        }
        path += (!path.endsWith("/") && !request.url.startsWith("/") ? "/" : "") + request.url;
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

        request.url = path;
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

    protected _mergeHeaders(_request: RequestAction): void{
        if(this.headers){
            this.headers.forEach((values: string[], name: string) => {
                for(let i = 0; i < values.length; i++){
                    _request.headers.append(name, values[i]);
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

    protected resources: { [id: string]: ResourceService; } = {};
    public defaultConfig: ResourceConfig;

    constructor(public http: Http, @Inject(RESOURCES_PROVIDER_NAME) appResources: ResourceConfig[]){
        this.createAll(appResources);
    }

    public create(res: ResourceConfig){
        if(res.name == DEFAULT_RESOURCE_NAME){
            this.defaultConfig = res;
        }else{
            if(this.defaultConfig != null){
                let newRes = Object.assign({}, this.defaultConfig);
                res = Object.assign(newRes, res);
            }
            this.resources[res.name] = new ResourceService(this.http, res);
        }
    }

    public createAll(resources: ResourceConfig[]){
        let defaultConfigInd: number = resources.findIndex((value: ResourceConfig) => {
            return value.name == DEFAULT_RESOURCE_NAME;
        });
        if(defaultConfigInd > -1){
            this.defaultConfig = resources[defaultConfigInd];
            resources.splice(defaultConfigInd, 1);
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
    listAction?: RequestAction;
    getAction?: RequestAction;
    insertAction?: RequestAction;
    updateAction?: RequestAction;
    deleteAction?: RequestAction;
    propertyMapping?: { [id: string]: string; };
    requestInterceptor?: RequestInterceptor;
    resultInterceptor?: ResultInterceptor;
}

export class ResourceResult{
    protected _$o: Observable<Response>;

    protected _$i: ResultInterceptor;

    get $o(): Observable<Response>{
        return this._$o;
    }

    get $d(): Observable<any>{
        return this._$o.map((r: Response) => r.json());
    }

    get $p(): Promise<Response>{
        return this._$o.toPromise();
    }

    get $s(): Promise<any>{
        return this.$d.toPromise();
    }

    get $i(): Observable<any>{
        return this._$i ? this._$i(this._$o) : this._$o;
    }

    constructor($o: Observable<Response>, $i?: ResultInterceptor){
        this._$o = $o;
        this._$i = $i;
    }
}

export function provideResources(config: ResourceConfig[]): any{
    return [
        {provide: RESOURCES_PROVIDER_NAME, useValue: config},
        ResourceFactory
    ];
}