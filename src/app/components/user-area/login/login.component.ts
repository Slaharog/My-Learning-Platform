import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';
import { CredentialsModel } from '../../../models/credentials.model';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

    private credential = new CredentialsModel();
    public credentialForm: FormGroup

    constructor(
        private userService: UserService,
        private router: Router,
        private formBuilder: FormBuilder,
        private notifyService: NotifyService

    ) { }


    public ngOnInit(): void {
        this.credentialForm = this.formBuilder.group({
            emailControl: new FormControl(""),
            passwordControl: new FormControl(""),
        });
    }

    public async send() {
        try {
            this.credential.email = this.credentialForm.get("emailControl").value;
            this.credential.password = this.credentialForm.get("passwordControl").value;
            await this.userService.login(this.credential);
            this.notifyService.success(`Welcome Back!`);
            this.router.navigateByUrl("/home");
        }
        catch (err: any) {
            if (err.status === 0)
                this.notifyService.error(`Server is unreachable. Please try again later.`);
            this.notifyService.error(err.error);
        }
    }
}
