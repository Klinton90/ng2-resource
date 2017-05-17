# Angular2 Resource

Simple factory based service for creating REST resources. 

## Features:
1) Provides object that contains: 
 - $o - `Observable<Response>`
 - $od - `Observable<json>` - use it if you don't need *Response* data (e.g. status, headers) (_read as "Observable Data"_)
 - $p - `Promise<Response>`
 - $pd - `Promise<json>` - use it if you don't need *Response* data (e.g. status, headers) (_read as "Promise Data"_)
 - $oi - `Observable<any>` - use it for getting processed response via `ResultInterceptor` (_read as "Observable Intercepted"_)
 - $pi - `Promise<any>` - use it for getting processed response via `ResultInterceptor` (_read as "Promise Intercepted"_)

2) Provides basic REST commands:
 - `request(request: RequestAction, obj?: Object)` - execute fully customizable request
 - `list(overrides?: RequestAction)` - get all resources
 - `get(id: number | Object, overrides?: RequestAction)` - find resource by `@id` (consumes `id: number` and `id: Object` forms)
 - `insert(data: Object, overrides?: RequestAction)` - create new resource
 - `update(data: Object, overrides?: RequestAction)` - update existing resource
 - `delete(id: number | Object, overrides?: RequestAction)` - delete existing resource (consumes `id: number` and `id: Object` forms)
 - `save(data: Object, overrides?: RequestAction)` - create or update resource. Autodetection is based on all generic request parameters provided for *updateAction*. 
 E.g. `updateAction.url = "/:id"`:
    - `let data = {id: 1, name: "user1"}` - will call `update()` action as `@id` parameter has been found.
    - `let data = {userId: 2, name: "user2"}` - will call `insert()` action as `@id` parameter is missing.
    
Every method accepts `overrides?: RequestAction` property. That is last chance for updating request parameters. 
For example, you can pass `search` string that will be added to current request only. That is useful for grid pagination or filtering.

3) Easy and comprehensive setup. Each `Resource` in config file must provide instance of `ResourceConfig` interface.
This interface defines couple properties:
 - `name: string;` - *required* resource name - will be used to retrieve resource from Factory.
 - `basePath?: string;` - base path for each request. If empty, use `name`
 - `headers?: Headers;` - default `Headers` that will be added to every request
 - `isRelative?: boolean;` - add/delete trailing slash to request (default value is `false`)
 - `listAction?: RequestOptionsArgs;` - Settings for `list()` command
 - `getAction?: RequestOptionsArgs;` - Settings for `get()` command
 - `insertAction?: RequestOptionsArgs;` - Settings for `insert()` command
 - `updateAction?: RequestOptionsArgs;` - Settings for `update()` command
 - `deleteAction?: RequestOptionsArgs;` - Settings for `delete()` command
 - `propertyMapping?: { [id: string]: string; }` - Property mapping.
  E.g. default `url` property for `get()` command is `/get/:id`. 
  But your object has `@id` property defined as `userId`. 
  Map request properties to your actual names as `propertyMapping: {"id" : "userId"}`
 - `requestInterceptor?: RequestInterceptor;` - Callback that will be executed for every Request. Individual action also
 could have `requestInterceptor`, then both will be executed.
 - `resultInterceptor?: ResultInterceptor;` - Callback that will be executed when `resource.$oi` property is used.
 Only one Interceptor will be executed: either on Resource or Action level. Action Interceptor has higher priority.

4) Each action property consumes *Angular's* 
 [RequestOptionsArgs](https://angular.io/docs/ts/latest/api/http/index/RequestOptionsArgs-interface.html) 
 object. With couple additional options:
 - `requestInterceptor?: RequestInterceptor;` - Callback that will be executed for every Request.
 When interceptor is provided for Resource and Action, both will be executed.
 - `resultInterceptor?: ResultInterceptor;` - Callback that will be executed when `resource.$oi` property is used.
 Only one Interceptor will be executed: either on Resource or Action level. Action Interceptor has higher priority.

5) Default settings. You can setup default settings resource that will be used for each created resource,
in case it doesn't  have own property. Note! You can use these resources for request execution.
 - `DEFAULT_RESOURCE_NAME` - if resource implementation has own value - use it, 
 otherwise take configuration from default resource
 - `MERGE_RESOURCE_NAME` - will be merged to all defined resources. Useful when you need to provide `Headers`
 or `interceptor`s that has to be called for all requests, but there is also resource specific logic exists.

#Quick Start

1) Create resources provider.
```
    //need this import for 'provideResources()' method
    import {ResourceConfig, provideResources} from "../resource.service";
    
    const appResources: ResourceConfig[] = [
        {
            name: "user",
            basePath: "customers",
            deleteAction: {
                url: "/remove/:userId",
                method: "GET"
            },
            propertyMapping: {
                "userId": "id"
            }
        },
        {
            name: "data"
        }
    ];
    
    export const appResourcesProvider = [
        provideResources(appResources)
    ];
```
2) Import `ResourceFactory` and `ResourceProvider` into your app.
```
    @NgModule({
        declarations: [
            AppComponent,
        ],
        imports: [
            BrowserModule,
            HttpModule,
        ],
        providers: [
            appResourcesProvider
        ],
        bootstrap: [AppComponent],
    })
    export class AppModule {}
```
3) Start using in `Components`.
```
    import {Component} from '@angular/core';
    import {ResourceFactory} from "../resource.service";
    
    @Component({
        selector: "app",
        template: `<h1>Angular2 Resources Example</h1>`
    })
    export class App {
        protected data: string;
    
        //Inject Factory
        constructor(rf: ResourceFactory){
            //Get Resource by 'name'
            this.rf.get("user")
                //execute request
                .list()
                //work with either Observable or Promise
                .$pd.then((data) => {
                    //NOTE! You don't need to call `response.json()`,
                    //as $pd already returns JSONified data
                    console.log(data);
                });
        }
    }
```

# Default Action mapping
| HTTP METHOD | URI            | Action |
| ----------- | -------------- | ------ |
| GET         | /:basePath     | list   |
| GET         | /:basePath/:id | get    |
| POST        | /:basePath     | create |
| PUT         | /:basePath/:id | update |
| DELETE      | /:basePath/:id | delete |

# Result processing examples

1) $o - `Observable<Response>`
```
request.$o
//get JSONified data
.map((data: Response) => data.json()) //data = {_body: "{id: '1', name: 'Klinton'}", status: 200, ok: true, statusText: "OK", headers: Headers…}
//then subscribe
.subscribe(
    (data) => {
        console.log(data);
    },
    (err) => {
        console.log(err);
    }
);
```
2) $do - `Observable<json>` - use it if you don't need *Response* data (e.g. status, headers)
```
request.$do.subscribe(
    (data) => {
        console.log(data); //data = {id: '1', name: 'Klinton'}
    },
    (err) => {
        console.log(err);
    }
);
```
3) $p - `Promise<Response>`
```
request.$p.then(data => { //data = {_body: "{id: '1', name: 'Klinton'}", status: 200, ok: true, statusText: "OK", headers: Headers…}
    //get JSONified data
    console.log(data.json())
}).catch(data => {
    console.log(data);
});
```
4) $pd - `Promise<json>` - use it if you don't need *Response* data (e.g. status, headers)
```
request.$pd.then(data => {
    console.log(data) //data = {id: '1', name: 'Klinton'}
}).catch(q => {
    console.log(data);
});
```
5) $oi - `Observable<any>` - use it for getting processed response via `ResultInterceptor`
```
let userResource = ResourceFactory.get('user');
userResource.resultInterceptor = (o: Observable<Response>) => {
    return o.map((data: Response) => { //data = {_body: "{id: '1', name: 'Klinton'}", status: 200, ok: true, statusText: "OK", headers: Headers…}
        let result = data.json();
        result.status = 'Ok';
        return result;
    });
};
request.$oi.subscribe(
    (data) => {
        console.log(data); //data = {id: '1', name: 'Klinton', status: 'Ok'}
    },
    (err) => {
        console.log(err);
    }
);
```
6) $pi - `Promise<any>` - use it for getting processed response via `ResultInterceptor`
```
let userResource = ResourceFactory.get('user');
userResource.resultInterceptor = (o: Observable<Response>) => {
    return o.map((data: Response) => { //data = {_body: "{id: '1', name: 'Klinton'}", status: 200, ok: true, statusText: "OK", headers: Headers…}
        let result = data.json();
        result.status = 'Ok';
        return result;
    });
};
request.$pi.then((data) => {
    console.log(data); //data = {id: '1', name: 'Klinton', status: 'Ok'}
}).catch((err) => {
    console.log(err);
});
```

# Default setting and Dependency Injection example

1) Let's assume I need "router" dependency in my ResultInterceptor. 
So I have to provide resources as `class` with own dependency
```
import {ResourceConfig, DEFAULT_RESOURCE_NAME} from "ng2-resource";

@Injectable()
export class AppResources{
    constructor(protected router: Router){};                        //Set dependency to 'Router'

    public getResources(): ResourceConfig[]{
        return [
            //We have 2 resources with restricted access (authentication and authorization are backend tasks).
            {
                name: "user"
            },
            {
                name: "order"
            },
            //We can implement shared redirection logic in case of unauthorized requests using default settings
            {
                name: DEFAULT_RESOURCE_NAME,                        //That property has been improted from 'ng2-resource'
                resultInterceptor: (o: Observable<Response>) =>{
                    let _o = o.share();
                    _o.subscribe(null, (err: Response) =>{
                        if(err.status == 401){
                            NotificationService.postMessage("Please login.", "Unauthenticated", 3000); //Custom NotificationService to provide feedback for user
                            this.router.navigate(["/login"]);       //Here we are using 'ng2-router' for redirection handling
                        }else if(err.status == 403){
                            NotificationService.postMessage("You do not have sufficient permissions for that action.", "Not authorized", 3000);
                            this.router.navigate(["/"]);
                        }else{
                            NotificationService.postMessage("Problems on server. Please try again later.", "Error", 3000);
                            this.router.navigate(["/"]);
                        }
                    });
                    return _o.map((r: Response) =>{
                        return r.json()
                    });
                }
            }
        ]
    };
}
```

2) Import Module like described below. That allows using ng2 dependency injection in Interceptors.
```
import {ResourceFactory, RESOURCES_PROVIDER_NAME} from "ng2-resource";

@NgModule({
        declarations: [
            AppComponent,
        ],
        imports: [
            BrowserModule,
            HttpModule,
        ],
        providers: [
            AppResources,                           //Imported Resources class implemented above
            ResourceFactory,                        //Imported ResourceFactory
            {
                provide: RESOURCES_PROVIDER_NAME,   //That property has been improted from 'ng2-resource'
                deps: [AppResources],               //Set dependency to Resources class. Instance of that class will be provided into "useFactory"
                useFactory: (ar) => {               //Use factory
                    return ar.getResources()        //Call factory method, where 'ar' is instance of 'AppResources'
                }
            }
        ],
        bootstrap: [AppComponent],
    })
    export class AppModule {}
```