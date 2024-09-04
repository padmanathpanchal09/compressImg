import { Routes } from '@angular/router';
import { MainPageComponent } from './mainPage/main-page/main-page.component';

export const routes: Routes = [
    {
        path:'',
        component:MainPageComponent
    },
    {
        path:'mainPage',
        component:MainPageComponent
    }
];
