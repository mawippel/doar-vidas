import {Routes} from "@angular/router";
import {HomeComponent} from "../app/home/home.component";
import { LoginComponent } from "./login/login.component";

export const ROUTES: Routes = [
    {path: '', component: HomeComponent},
    {path: 'login', component: LoginComponent}
]