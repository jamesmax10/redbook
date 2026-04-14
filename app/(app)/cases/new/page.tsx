import { createCase } from "@/app/actions";
import { inputClass, btnPrimary, card, pageTitle, labelClass } from "@/lib/styles";

export default function NewCasePage() {
  return (
    <div>
      <h1 className={`${pageTitle} mb-8`}>Create New Case</h1>

      <form action={createCase} className={`${card} p-6 max-w-xl space-y-5`}>
        <div>
          <label htmlFor="client_name" className={labelClass}>
            Client Name
          </label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="property_address" className={labelClass}>
            Property Address
          </label>
          <input
            type="text"
            id="property_address"
            name="property_address"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="valuation_date" className={labelClass}>
            Valuation Date
          </label>
          <input
            type="date"
            id="valuation_date"
            name="valuation_date"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="purpose" className={labelClass}>
            Purpose
          </label>
          <select id="purpose" name="purpose" required className={inputClass}>
            <option value="">Select purpose...</option>
            <option value="Secured Lending">Secured Lending</option>
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="Financial Reporting">Financial Reporting</option>
            <option value="Tax / CGT">Tax / CGT</option>
            <option value="Insurance">Insurance</option>
            <option value="Probate">Probate</option>
            <option value="Litigation">Litigation</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="basis_of_value" className={labelClass}>
            Basis of Value
          </label>
          <select
            id="basis_of_value"
            name="basis_of_value"
            required
            className={inputClass}
          >
            <option value="">Select basis...</option>
            <option value="Market Value">Market Value</option>
            <option value="Market Rent">Market Rent</option>
            <option value="Fair Value">Fair Value</option>
            <option value="Investment Value">Investment Value</option>
            <option value="Existing Use Value">Existing Use Value</option>
          </select>
        </div>

        <div className="pt-3">
          <button type="submit" className={btnPrimary}>
            Create Case
          </button>
        </div>
      </form>
    </div>
  );
}
