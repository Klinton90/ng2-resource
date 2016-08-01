import { Component } from '@angular/core';
import {ResourceFactory} from "../resource.service";
import {Response} from "@angular/http";

@Component({
    selector: "app",
    template: `
        <h1>Angular2 Resources Example</h1>
        <button type="button" (click)="test()">Request '/user/getAll' URL</button>
        <p>{{data}}</p>
    `
})
export class App {
    protected data: string;

    constructor(protected rf: ResourceFactory){
    }
    
    test(){
        this.rf.get("user").list().$p.then((response: Response) => {
            this.data = response.toString();
            console.log(response.json());
        });
    }
}