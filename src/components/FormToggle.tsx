import { letters } from '../data/letters';
import { en } from '../i18n/en';
import { FORMS, glyph, type Form } from '../lib/forms';
import { showHome } from '../lib/router';

// Letter, Subscript or Both, as radio buttons styled as one segmented control.
// Each option shows ក in that form, so it reads without knowing the words.
export function FormToggle({ form, fontReady }: { form: Form; fontReady: boolean }) {
  return (
    <fieldset className="grid grid-cols-3 gap-1 rounded-2xl bg-stone-200 p-1">
      <legend className="sr-only">{en.grid.formLegend}</legend>
      {FORMS.map((option) => (
        <label
          key={option}
          className="flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl text-sm text-stone-700 has-checked:bg-white has-checked:font-semibold has-checked:text-stone-900 has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-stone-900"
        >
          <input
            type="radio"
            name="form"
            value={option}
            checked={option === form}
            onChange={() => showHome(option)}
            className="sr-only"
          />
          <span lang="km" aria-hidden="true" className={`text-2xl leading-[normal] ${fontReady ? '' : 'invisible'}`}>
            {glyph(letters[0], option)}
          </span>
          <span className="leading-none">{en.grid.forms[option]}</span>
        </label>
      ))}
    </fieldset>
  );
}
