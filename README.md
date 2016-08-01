# Angular2 Resource

Simple factory based service for creating REST resources. 

## Features:
1) Provides both Observable and Promise as output parameters

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
 - `listAction?: RequestOptionsArgs;` - Settings for `list()` command
 - `getAction?: RequestOptionsArgs;` - Settings for `get()` command
 - `insertAction?: RequestOptionsArgs;` - Settings for `insert()` command
 - `updateAction?: RequestOptionsArgs;` - Settings for `update()` command
 - `deleteAction?: RequestOptionsArgs;` - Settings for `delete()` command
 - `propertyMapping?: { [id: string]: string; }` - Property mapping. 
 E.g. default `url` property for `get()` command is `/get/:id`. 
 But your object has `@id` property defined as `userId`. 
 Map request properties to your actual names as `propertyMapping: {"id" : "userId"}`

4) Each action property consumes *Angular's* 
 [RequestOptionsArgs](https://angular.io/docs/ts/latest/api/http/index/RequestOptionsArgs-interface.html) 
 object.

#Quick Start

1) Create resources provider.
```
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
    //Standard imports
    import { bootstrap }    from '@angular/platform-browser-dynamic';
    import { HTTP_PROVIDERS } from '@angular/http';
    import { App } from './app';
    //Service imports
    import {ResourceFactory} from "../resource.service";
    import {appResourcesProvider} from "./app.resources";
    
    bootstrap(<any>App, [
        HTTP_PROVIDERS,
        ResourceFactory,
        appResourcesProvider
    ]).catch(err => console.log(err));
```
3) Start using in `Components`.
```
    import { Component } from '@angular/core';
    import {ResourceFactory} from "../resource.service";
    
    @Component({
        selector: "app",
        template: `<h1>Angular2 Resources Example</h1>`
    })
    export class App {
        protected data: string;
    
        //Inject Factory
        constructor(protected rf: ResourceFactory){
            //Get Resource by 'name'
            this.rf.get("user")
                //execute request
                .list()
                //work with either $o - Observable
                //or with $p - Promise
                .$p.then((response) => {
                    console.log(response.json());
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

# TODO
1) Allow `_default` settings for each `Action`, to overwrite all requests at once.

2) Allow `saveCriteria` callback for custom autodetection logic in `save()` method.