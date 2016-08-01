import { bootstrap }    from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS } from '@angular/http';

import "../rxjs-ext";

import { App } from './app';
import {ResourceFactory} from "../resource.service";
import {appResourcesProvider} from "./app.resources";

bootstrap(<any>App, [
    HTTP_PROVIDERS,
    ResourceFactory,
    appResourcesProvider
]).catch(err => console.log(err));