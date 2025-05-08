import {
  AfterViewInit,
  Component,
  forwardRef,
  inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
  TouchedChangeEvent,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, takeUntil } from 'rxjs';
import {
  Language,
  LanguageShort,
} from 'src/app/services/api/entities/config.entity';
import { LanguageService } from 'src/app/services/language/language.service';

@Component({
  selector: 'app-language-autocomplete',
  imports: [
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LanguageAutocompleteComponent),
      multi: true,
    },
  ],
  templateUrl: './language-autocomplete.component.html',
  styleUrl: './language-autocomplete.component.scss',
})
export class LanguageAutocompleteComponent
  implements OnInit, ControlValueAccessor, AfterViewInit, OnDestroy
{
  @Input({ required: true }) languages!: LanguageShort[] | Language[];

  @ViewChild(MatAutocompleteTrigger) _auto!: MatAutocompleteTrigger;

  _localizedLanguages!: LanguageShort[];
  filteredLanguages!: LanguageShort[];

  languageService = inject(LanguageService);
  injector = inject(Injector);
  ngControl?: NgControl;

  destroy$$ = new Subject<void>();

  inputControl = new FormControl(
    { code: '', name: '' },
    {
      validators: [this.inputValidation.bind(this)],
    }
  );

  required = false;

  ngOnInit(): void {
    this._localizedLanguages = this.localizeLanguages();
    this.filteredLanguages = this._localizedLanguages;
  }

  ngAfterViewInit(): void {
    const control = this.injector.get(NgControl, null);
    if (control) {
      this.ngControl = control;
      this.ngControl.valueAccessor = this;

      this.required = this.ngControl.control!.hasValidator(Validators.required);

      this.ngControl
        .control!.events.pipe(takeUntil(this.destroy$$))
        .subscribe((event) => {
          if (event instanceof TouchedChangeEvent) {
            this.inputControl.markAsTouched();
          }
        });
    }
  }

  inputValidation(control: AbstractControl): ValidationErrors | null {
    if (this.ngControl) {
      const value = this.ngControl.control!.getRawValue();
      if (!value) return { required: true };
    }

    return null;
  }

  localizeLanguages(): LanguageShort[] {
    const locale = $localize.locale;
    return this.languages
      .map((language: any) => ({
        code: language.code,
        name:
          (locale?.startsWith('en')
            ? language.englishName
            : language.germanName) ||
          this.languageService.getLocalizedLanguage(language.code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  onChange = (value: string) => {};
  registerOnTouched(fn: any) {}

  writeValue(value: string): void {
    if (value) {
      const language = {
        code: value,
        name: this.languageService.getLocalizedLanguage(value),
      };

      this.inputControl.setValue(language, { emitEvent: false });

      setTimeout(() => {
        this.filteredLanguages = this._localizedLanguages.filter((l) => {
          return value === l.code || l.code.startsWith(value + '-');
        });

        this._auto.autocomplete.options.forEach((o) => {
          if (value === o.value.code || o.value.code.startsWith(value + '-')) {
            o.select();
          }
        });
      });
    }
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  setDisabledState?(disabled: boolean): void {
    if (disabled) {
      this.inputControl.disable();
    } else {
      this.inputControl.enable();
    }
  }

  onInputChange({ target }: Event) {
    const value = (target as HTMLInputElement).value.toLowerCase();
    this.filteredLanguages = value
      ? this._localizedLanguages.filter(({ name }) =>
          name.toLowerCase().includes(value)
        )
      : this._localizedLanguages;

    const parentValue = this.ngControl?.control!.getRawValue();
    if (parentValue) {
      this.onChange('');
      this.inputControl.updateValueAndValidity();
    }
  }

  onSelectionChanged(e: MatAutocompleteSelectedEvent) {
    this.onChange(e.option.value.code);
    this.inputControl.updateValueAndValidity();
  }

  displayFn(language: LanguageShort): string {
    return language ? language.name : '';
  }

  ngOnDestroy(): void {
    this.destroy$$.next();
  }
}
