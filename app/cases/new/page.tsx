import { createCase } from "@/app/actions";

export default function NewCasePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Create New Case
      </h1>

      <form
        action={createCase}
        className="bg-white rounded-lg border border-zinc-200 p-6 max-w-xl space-y-5"
      >
        <div>
          <label
            htmlFor="client_name"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Client Name
          </label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="property_address"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Property Address
          </label>
          <input
            type="text"
            id="property_address"
            name="property_address"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="valuation_date"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Valuation Date
          </label>
          <input
            type="date"
            id="valuation_date"
            name="valuation_date"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="purpose"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Purpose
          </label>
          <select
            id="purpose"
            name="purpose"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          >
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
          <label
            htmlFor="basis_of_value"
            className="block text-sm font-medium text-zinc-700 mb-1"
          >
            Basis of Value
          </label>
          <select
            id="basis_of_value"
            name="basis_of_value"
            required
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
          >
            <option value="">Select basis...</option>
            <option value="Market Value">Market Value</option>
            <option value="Market Rent">Market Rent</option>
            <option value="Fair Value">Fair Value</option>
            <option value="Investment Value">Investment Value</option>
            <option value="Existing Use Value">Existing Use Value</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-zinc-900 text-white px-5 py-2 rounded-md text-sm hover:bg-zinc-700"
          >
            Create Case
          </button>
        </div>
      </form>
    </div>
  );
}
