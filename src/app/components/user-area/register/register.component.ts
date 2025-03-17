import { Component, OnInit } from '@angular/core';
import { UserModel } from '../../../models/user.model';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../../services/notify.service';

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

    private user = new UserModel();
    public userForm: FormGroup;

    constructor(
        private userService: UserService,
        private router: Router,
        private formBuilder: FormBuilder,
        private notifyService: NotifyService
    ) { }


    public ngOnInit(): void {
        this.userForm = this.formBuilder.group({
            nameControl: new FormControl(""),
            emailControl: new FormControl(""),
            passwordControl: new FormControl(""),
        });
    }

    public async send() {
        try {
            this.user.name = this.userForm.get("nameControl").value;
            this.user.email = this.userForm.get("emailControl").value;
            this.user.password = this.userForm.get("passwordControl").value;
            await this.userService.register(this.user);
            this.notifyService.success(`Welcome ${this.user.name}`);
            this.router.navigateByUrl("/home");
        }
        catch (err: any) {
            if (err.status === 0)
                this.notifyService.error('Server is unreachable. Please try again later.');
            this.notifyService.error(err.error);
        }
    }
}

