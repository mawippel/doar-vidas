import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms'
import { State } from '../model/state.model';
import { StatesService } from '../services/states.service';
import { BloodType } from '../model/blood.type.model';
import { RegisterService } from '../services/register.service';
import { Donator } from '../model/donator.model';
import { Institution } from '../model/institution.model';
import { LoginService } from '../services/login.service';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { GlobalService } from '../services/global.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {

  registerForm: FormGroup

  hidePass = true;
  hideCPass = true;

  cnpjPattern = /(^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$)/

  cpfPattern = /(^\d{3}\.\d{3}\.\d{3}\-\d{2}$)/

  bloodTypes: BloodType[] = [
    {code: 'APOS', description: 'A+'},
    {code: 'ANEG', description: 'A-'},
    {code: 'BPOS', description: 'B+'},
    {code: 'BNEG', description: 'B-'},
    {code: 'ABPOS', description: 'AB+'},
    {code: 'ABNEG', description: 'AB-'},
    {code: 'OPOS', description: 'O+'},
    {code: 'ONEG', description: 'O-'}
  ]

  labelCpf = "* Cpf"

  labelName = "* Nome"

  labelLastname = "* Sobrenome"

  personInstitution = "I"
  personDonator = "D"

  statesObject: Array<State>

  constructor(private formBuilder: FormBuilder, private statesService: StatesService,
     private registerService: RegisterService,private location: Location, private loginService: LoginService,
     private router: Router, private globalService: GlobalService)
  {}

  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      name: this.formBuilder.control('',[Validators.required, Validators.minLength(3)]),
      lastName: this.formBuilder.control('',[Validators.required, Validators.minLength(3)]),
      personType: this.formBuilder.control('D',[Validators.required]),
      email: this.formBuilder.control('', [Validators.required, Validators.email]),
      phone: this.formBuilder.control('',[Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
      cpfCnpj: this.formBuilder.control('',[Validators.required]),
      state: this.formBuilder.control('', [Validators.required]),
      city: this.formBuilder.control('',[Validators.required]),
      bloodType: this.formBuilder.control('',[Validators.required]),
      description: this.formBuilder.control('',[Validators.required]),
      password: this.formBuilder.control('',[Validators.required, Validators.minLength(6)]),
      confirmPassword: this.formBuilder.control('', [Validators.required, Validators.minLength(6)]),
    }, {validator: RegisterComponent.equalsTo})

    this.getStates()
    this.onChanges()
  }

  static equalsTo(group: AbstractControl): {[key:string]: boolean} {
    const password = group.get('password')
    const passwordConfirmation = group.get('confirmPassword')

    if (!password || !passwordConfirmation) {
      return undefined
    }

    if (password.value !== passwordConfirmation.value) {
      return {passwordsNotMatch:true}
    }

    return undefined
  }

  onChanges(): void {
    this.registerForm.get('personType').valueChanges.subscribe(val => {
      const bloodControl = this.registerForm.get('bloodType')
      if (val == 'D') {
        this.registerForm.get('cpfCnpj').setValidators(Validators.pattern(this.cpfPattern))
        this.labelCpf = "* Cpf"
        this.labelName = "* Nome"
        this.labelLastname = "* Sobrenome"
        bloodControl.setValidators(Validators.required)
      } else {
        this.registerForm.get('cpfCnpj').setValidators(Validators.pattern(this.cnpjPattern))
        this.labelCpf = "* Cnpj"
        this.labelName = "* Nome Fantasia"
        this.labelLastname = "* Razão Social"
        bloodControl.clearValidators()
      }
      bloodControl.updateValueAndValidity();
    });
  }

  getStates(): void {
    this.statesService.getStates().subscribe(
      response => this.statesObject = {... response},
      (error) => this.globalService.handleError(error))
  }

  onSubmit() {
    if (this.registerForm.valid) {
      let cpfCnpj = this.registerForm.get('cpfCnpj').value
      this.registerForm.get('cpfCnpj').setValue(cpfCnpj.replace(/\D/g,''))
      if (this.registerForm.get('bloodType').value.length) {
        this.registerDonator(this.registerForm.value)
      } else {
        this.registerInstitution(this.registerForm.value)
      }
    }
    return false
  }

  registerDonator(donator: Donator) {
    this.registerService.registerDonator(donator).subscribe(
      (data) => this.loginAction(this.registerForm.get('email').value,this.registerForm.get('password').value, this.personDonator),
      (error) => this.globalService.handleError(error)
    )
  }

  registerInstitution(institution: Institution) {
    this.registerService.registerInstitution(institution).subscribe(
      (data) => this.loginAction(this.registerForm.get('email').value,this.registerForm.get('password').value, this.personInstitution),
      (error) => this.globalService.handleError(error)
    )
  }

  loginAction(username: string, password:string, personType:string) {
    const body = new HttpParams()
      .set(`username`, username)
      .set(`password`, password)
      .set(`grant_type`, `password`);

    this.loginService.loginAction(body).subscribe(
      (data) => this.onSuccess(data, personType),
      (error) => this.globalService.handleError(error)
    )
  }

  onSuccess(data, personType) {
    localStorage.setItem('access_token',data.access_token)
    this.globalService.getUserByEmail(this.registerForm.get('email').value).subscribe (
      (data) => {
        localStorage.setItem('user_info', JSON.stringify(data))
        if (personType == this.personDonator) {
          this.router.navigate(['/solicitations']);
        } else {
          this.router.navigate(['/donators']);
        }
        this.loginService.onSuccess();
      },
      (error) => this.globalService.handleError(error)
    )
  }

  cancel() {
    this.location.back(); // <-- go back to previous location on cancel
  }
}
