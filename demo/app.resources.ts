import {ResourceConfig, provideResources} from "../resource.service";

const appResources: ResourceConfig[] = [
    {
        name: "user",
        listAction: {
            url: "/getAll/",
            method: "GET"
        },
        deleteAction: {
            url: "/remove/:userId"
        },
        propertyMapping: {
            "userId": "id"
        }
    },
    {
        name: "books"
    }
];

export const appResourcesProvider = [
    provideResources(appResources)
];