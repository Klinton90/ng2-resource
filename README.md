# Angular2 Resource

Simple factory based service for creating REST resources. 

## Features:
1) Provides object that contains: 
 - $o - `Observable<Response>`
 - $d - `Observable<json>` - use it if you don't need *Response* data (e.g. status, headers)
 - $p - `Promise<Response>`
 - $s - `Promise<json>` - use it if you don't need *Response* data (e.g. status, headers)
 - $i - `Observable<any>` - use it for getting processed response via `ResultInterceptor`

2) Provides basic REST commands:
 - `list()`     - get all resources
 - `get()`      - find resource by `@id` (consumes `id: number` and `id: Object` forms)
 - `insert()`   - create new resource
 - `update()`   - update existing resource
 - `delete()`   - delete existing resource (consumes `id: number` and `id: Object` forms)
 - `save()`     - create or update resource. Autodetection is based on all generic request parameters provided for *updateAction*. 
 E.g. `updateAction.url = "/:id"`:
    - `let data = {id: 1, name: "user1"}` - will call `update()` action as `@id` parameter has been found.
    - `let data = {userId: 2, name: "user2"}` - will call `insert()` action as `@id` parameter is missing.

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
 - `resultInterceptor?: ResultInterceptor;` - Callback that will be executed when `resource.$i` property is used.
 Only one Interceptor will be executed: either on Resource or Action level. Action Interceptor has higher priority.

4) Each action property consumes *Angular's* 
 [RequestOptionsArgs](https://angular.io/docs/ts/latest/api/http/index/RequestOptionsArgs-interface.html) 
 object. With couple additional options:
 - `requestInterceptor?: RequestInterceptor;` - Callback that will be executed for every Request.
 When interceptor is provided for Resource and Action, both will be executed.
 - `resultInterceptor?: ResultInterceptor;` - Callback that will be executed when `resource.$i` property is used.
 Only one Interceptor will be executed: either on Resource or Action level. Action Interceptor has higher priority.

5) Default settings. You can setup default settings resource that will be used for each created resource,
in case it doesn't  have own property.

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
                .$s.then((data) => {
                    //NOTE! You don't need to call `response.json()`,
                    //as $s already returns JSONified data
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
2) $d - `Observable<json>` - use it if you don't need *Response* data (e.g. status, headers)
```
request.$d.subscribe(
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
4) $s - `Promise<json>` - use it if you don't need *Response* data (e.g. status, headers)
```
request.$s.then(data => {
    console.log(data) //data = {id: '1', name: 'Klinton'}
}).catch(q => {
    console.log(data);
});
```
5) $i - `Observable<any>` - use it for getting processed response via `ResultInterceptor`
```
let userResource = ResourceFactory.get('user');
userResource.resultInterceptor = (o: Observable<Response>) => {
    return o.map((data: Response) => { //data = {_body: "{id: '1', name: 'Klinton'}", status: 200, ok: true, statusText: "OK", headers: Headers…}
        let result = data.json();
        result.status = 'Ok';
        return result;
    });
};
request.$i.subscribe(
    (data) => {
        console.log(data); //data = {id: '1', name: 'Klinton', status: 'Ok'}
    },
    (err) => {
        console.log(err);
    }
);
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

2) Module import schema changed a bit. That implementation allows using standard ng2 dependency injection in your Interceptors
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