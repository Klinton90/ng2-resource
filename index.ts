import {Http, RequestMethod, RequestOptionsArgs, Response} from '@angular/http';
import {Injectable, Inject} from "@angular/core";
import {Observable} from 'rxjs/Rx';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

const providerName = "APP_RESOURCES";

export class ResourceService {

    public basePath: string;
    protected propertyMapping: { [id: string]: string; } = {};
    protected listAction: RequestOptionsArgs = {
        url: "/",
        method: RequestMethod.Get
    };
    protected getAction: RequestOptionsArgs = {
        url: "/:id",
        method: RequestMethod.Get
    };
    protected insertAction: RequestOptionsArgs = {
        url: "/",
        method: RequestMethod.Post
    };
    protected updateAction: RequestOptionsArgs = {
        url: "/:id",
        method: RequestMethod.Put
    };
    protected deleteAction: RequestOptionsArgs = {
        url: "/:id",
        method: RequestMethod.Delete
    };

    constructor(protected _http: Http, protected res: ResourceConfig){
        this.basePath = res.basePath ? res.basePath : res.name;
        this.propertyMapping = res.propertyMapping;
        Object.assign(this.listAction, res.listAction);
        Object.assign(this.getAction, res.getAction);
        Object.assign(this.insertAction, res.insertAction);
        Object.assign(this.updateAction, res.updateAction);
        Object.assign(this.deleteAction, res.deleteAction);
    }

    public list(): ResourceResult{
        let request: RequestOptionsArgs = this._initRequest(this.listAction);
        return this._executeRequest(request);
    }

    public get(data: Object): ResourceResult;
    public get(data: number): ResourceResult{
        let obj: {};
        if(typeof data == "number"){
            obj = {id: data};
        }else{
            obj = data;
        }
        let request: RequestOptionsArgs = this._initRequest(this.getAction, obj);
        return this._executeRequest(request);
    }

    public delete(data: Object): ResourceResult;
    public delete(data: number): ResourceResult{
        let obj: {};
        if(typeof data == "number"){
            obj = {id: data};
        }else{
            obj = data;
        }
        let request: RequestOptionsArgs = this._initRequest(this.deleteAction, obj);
        return this._executeRequest(request);
    }

    public insert(data: Object): ResourceResult{
        let request: RequestOptionsArgs = this._initRequest(this.insertAction, data);
        return this._executeRequest(request);
    }

    public update(data: Object): ResourceResult{
        let request: RequestOptionsArgs = this._initRequest(this.updateAction, data);
        return this._executeRequest(request);
    }

    public save(data: Object): ResourceResult{
        if(this._isUpdateAction(data)){
            return this.update(data);
        }else{
            return this.insert(data);
        }
    }

    protected _initRequest(request: RequestOptionsArgs, obj?: Object): RequestOptionsArgs{
        let path: string = "/" + this.basePath + (request.url.startsWith("/") ? "" : "/") + request.url;
        if(obj){
            let parts: string[] = path.split("/");
            parts.forEach((part: string) => {
                if(part.startsWith(":")){
                    let value: any = this._findValueByMap(obj, part);
                    if(value){
                        path = path.replace(part, value.toString());
                    }
                }
            });

            if([RequestMethod.Patch, RequestMethod.Post, RequestMethod.Put, "PATCH", "POST", "PUT"].indexOf(request.method) >= 0){
                request.body = obj;
            }
        }
        request.url = path;

        return request;
    }

    protected _executeRequest(request: RequestOptionsArgs): ResourceResult{
        let o = this._http.request("", request);
        return {
            $o: o,
            $p: o.toPromise().catch(response => {
                console.log("Cannot retrieve data from specified location: '" + request.url + "'");
                console.log(response);
            })
        };
    }

    protected _findValueByMap(obj: Object, part: string): any{
        let key: string = part.substring(1, part.length);
        let newKey: string = this.propertyMapping[key];

        return newKey ? obj[newKey] : obj[key];
    }

    protected _isUpdateAction(data: Object): boolean{
        let isUpdate: boolean = true;
        let parts: string[] = this.updateAction.url.split("/");
        for(let i: number = 0; i < parts.length; i++){
            let part: string = parts[i];
            if(part.startsWith(":")){
                let value: any = this._findValueByMap(data, part);
                if(!value || value.toString().length == 0){
                    isUpdate = false;
                    break;
                }
            }
        }

        return isUpdate;
    }
}

@Injectable()
export class ResourceFactory{

    protected resources: { [id: string]: ResourceService; } = {};

    constructor(public http: Http, @Inject(providerName) appResources: ResourceConfig[]){
        this.createAll(appResources);
    }

    public create(res: ResourceConfig){
        let _res = new ResourceService(this.http, res);
        this.resources[res.name] = _res;
    }

    public createAll(resources: ResourceConfig[]){
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

export interface ResourceConfig{
    name: string;
    basePath?: string;
    listAction?: RequestOptionsArgs;
    getAction?: RequestOptionsArgs;
    insertAction?: RequestOptionsArgs;
    updateAction?: RequestOptionsArgs;
    deleteAction?: RequestOptionsArgs;
    propertyMapping?: { [id: string]: string; }
}

export interface ResourceResult{
    $o: Observable<any>;
    $p: Promise<any>;
}

export function provideResources(config: ResourceConfig[]): any{
    return {provide: providerName, useValue: config};
}