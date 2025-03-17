import { Injectable } from '@angular/core';
import { Notyf } from 'notyf';

@Injectable({
    providedIn: 'root'
})
export class NotifyService {

    private notyf = new Notyf({
        duration: 3000,
        position: { x: "center", y: "top" },
        dismissible: true,
        ripple: true
    });

    public success(message: string): void {
        this.notyf.success(message);
    }

    public error(error: any): void {
        const message = this.extractError(error);
        this.notyf.error(message);
    }

    private extractError(error: any): string {

        console.log("----------------------------");
        console.log(error);
        console.log("----------------------------");
        
        if(typeof error === "string") return error;

        if(typeof error.error === "string") return error.error;

        if(Array.isArray(error.error) && typeof error.error[0].errorMessage === "string") return error.error[0].errorMessage;
        
        if(typeof error.message === "string") return error.message;

        return "Some Error, Please try again";
    }

}
