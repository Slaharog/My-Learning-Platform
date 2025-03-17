import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { FooterComponent } from "../footer/footer.component";
import { HomeComponent } from "../../page-area/home/home.component";
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-layout',
    imports: [HeaderComponent, FooterComponent, RouterModule],
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.css'
})
export class LayoutComponent {

}
