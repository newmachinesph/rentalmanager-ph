/* ------------------------------------------------------------------ */
/*  Contract template generator — based on Philippine lease contract   */
/* ------------------------------------------------------------------ */

export interface ContractData {
  /* Execution */
  contractDate: string;       // e.g. "March 4, 2026"
  contractLocation: string;   // e.g. "Quezon City"

  /* Lessor */
  lessorCompany: string;
  lessorDescription: string;  // e.g. "a corporation duly organized..."
  lessorAddress: string;
  lessorRepName: string;
  lessorRepTitle: string;

  /* Lessee */
  lesseeName: string;
  lesseeAddress: string;

  /* Property */
  propertyName: string;
  propertyFullAddress: string;
  unitName: string;
  purpose: string;            // "Residential" | "Commercial"

  /* Lease terms */
  startDate: string;          // formatted
  endDate: string;            // formatted
  leaseTerm: string;          // e.g. "ONE (1) YEAR"
  monthlyRent: number;
  securityDeposit: number;
  advancePayment: number;
  paymentDueDay: number;
  penaltyRate: number;        // e.g. 3

  /* Signatories */
  witnessName1: string;
  witnessName2: string;

  /* Additional */
  lessorTin?: string;          // TIN for notarial acknowledgement
}

/* ------------------------------------------------------------------ */
/*  Amount → words  (Philippine Peso)                                 */
/* ------------------------------------------------------------------ */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertChunk(n % 100) : '');
  if (n < 1_000_000) return convertChunk(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertChunk(n % 1000) : '');
  if (n < 1_000_000_000) return convertChunk(Math.floor(n / 1_000_000)) + ' Million' + (n % 1_000_000 ? ' ' + convertChunk(n % 1_000_000) : '');
  return convertChunk(Math.floor(n / 1_000_000_000)) + ' Billion' + (n % 1_000_000_000 ? ' ' + convertChunk(n % 1_000_000_000) : '');
}

export function amountToWords(amount: number): string {
  if (amount === 0) return 'Zero Pesos';
  const whole = Math.floor(Math.abs(amount));
  const cents = Math.round((Math.abs(amount) - whole) * 100);
  let result = convertChunk(whole) + ' Pesos';
  if (cents > 0) result += ' and ' + convertChunk(cents) + ' Centavos';
  return result.toUpperCase();
}

export function formatPeso(amount: number): string {
  return 'PHP ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/*  Generate full contract HTML — 38 sections                         */
/*  Standard commercial stall lease template                           */
/* ------------------------------------------------------------------ */

export function generateContractHtml(d: ContractData): string {
  const monthlyRentFmt = formatPeso(d.monthlyRent);
  const monthlyRentWords = amountToWords(d.monthlyRent);
  const secDepFmt = formatPeso(d.securityDeposit);
  const secDepWords = amountToWords(d.securityDeposit);
  const advFmt = formatPeso(d.advancePayment);
  const advWords = amountToWords(d.advancePayment);
  const penalty = d.penaltyRate;
  const lesseeAddr = d.lesseeAddress || '______________________________________';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @media print {
    body { margin: 0; }
    .contract { padding: 0.75in 1in; }
    .no-print { display: none !important; }
  }
  @media screen {
    .contract { max-width: 8.5in; margin: 0 auto; padding: 40px 60px; }
  }
  .contract {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #000;
  }
  .contract h1 {
    text-align: center;
    font-size: 16pt;
    font-weight: bold;
    margin-bottom: 4px;
    text-decoration: underline;
  }
  .contract p {
    text-align: justify;
    margin-bottom: 12px;
    text-indent: 0;
  }
  .contract .section-title {
    font-weight: bold;
    margin-top: 16px;
  }
  .contract .center { text-align: center; }
  .contract .indent { padding-left: 40px; }
  .contract .sig-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 50px;
  }
  .contract .sig-table td {
    padding: 4px 0;
    vertical-align: top;
  }
  .contract .witness-block {
    margin-top: 40px;
  }
  .contract .ack-block {
    margin-top: 40px;
    border-top: 2px solid #000;
    padding-top: 20px;
  }
</style>
</head>
<body>
<div class="contract">

<h1>LEASE CONTRACT</h1>

<p class="center"><br>KNOW ALL MEN BY THESE PRESENTS:</p>

<p><br>This CONTRACT OF LEASE is made and executed at ${d.contractLocation}, this day of, <strong>${d.contractDate}</strong>, by and between:</p>

<p><strong>${d.lessorCompany}</strong>, ${d.lessorDescription}, with principal office at ${d.lessorAddress}, represented herein by its ${d.lessorRepTitle}, <strong>${d.lessorRepName}</strong>, hereinafter referred to as the LESSOR.</p>

<p class="center">-and-</p>

<p><strong>${d.lesseeName}</strong>, of legal age, Filipino citizen and a resident at ${lesseeAddr} hereinafter referred to as the LESSEE.</p>

<p class="center"><br>WITNESSETH; That</p>

<p>WHEREAS, the LESSOR is the true, lawful and registered owner of <strong>${d.propertyName}</strong>, hereinafter referred to as the LEASED PREMISES, a ${d.purpose.toLowerCase()} property situated at ${d.propertyFullAddress}.</p>

<p>WHEREAS, the LESSEE desires to lease the said ${d.propertyName} stall and the LESSOR is willing to let the same to the LESSEE;</p>

<p>NOW THEREFORE, for and in consideration of the foregoing premises, and the conditions and stipulations hereinafter set forth, the LESSOR hereby lease unto the LESSEE <strong>${d.unitName}</strong> under the following terms and conditions:</p>

<p class="center"><br><strong>TERMS AND CONDITIONS</strong></p>

<!-- SECTION 1 -->
<p class="section-title">1. PURPOSES:</p>
<p>That said premises hereby leased shall be used exclusively by the LESSEE for ${d.purpose.toLowerCase()} purposes only and shall not be diverted to other uses without the expressed and written approval by the LESSOR. It is hereby expressly agreed that if at any time the premises are used for other purposes, the LESSOR shall have the right to rescind this contract without prejudice to its other rights under the law.</p>

<!-- SECTION 2 -->
<p class="section-title">2. TERM:</p>
<p>This contract shall commence on <strong>${d.startDate}</strong> and automatically terminating on <strong>${d.endDate}</strong>. No interruption in the physical possession by the LESSEE for any reason shall serve to extend the terms of this lease.</p>

<p>The LESSOR shall be entitled to the immediate recovery of the possession of the Leased Premises upon such automatic termination, without the necessity of previous notice or demand, or of any judicial action for ejectment or rescission;</p>

<p>The continued possession by the LESSEE of the Leased Premises beyond the automatic expiration of the contract of lease shall revert lease to a monthly basis with the rest of the provision of the contract of lease still applying. In the case of monthly lease, the LESSOR shall have to option not to renew the lease on the next month and the LESSEE, in such case, gives the LESSOR a special power of attorney to padlock the Leased Premises, to cut the electric and water utilities to the Leased Premises without incurring any civil or criminal liabilities therefor.</p>

<p>Provided, finally, that if the LESSEE should persist in occupying the Leased Premises without any lease contract in writing after the expiration or earlier termination of this Contract, then LESSEE shall be liable to pay LESSOR such reasonable value for the use and enjoyment of said Leased Premises as may be determined by the LESSOR in its sole discretion over and above any damages.</p>

<p>At the expiration of the term of this lease or cancellation thereof, as herein provided, the LESSEE will promptly deliver to the LESSOR the leased premises with all corresponding keys and in as good and tenable condition as the same is now, ordinary wear and tear expected devoid of all occupants, movable furniture, articles and effects of any kind. Non-compliance with the terms of this clause by the LESSEE will give the LESSOR the right, at the latter's option, to refuse to accept the delivery of the premises and compel the LESSEE to pay rent therefrom at the same rate plus Twenty Five (25) % thereof as penalty until the LESSEE shall have complied with the terms hereof. The same penalty shall be imposed in case the LESSEE fails to leave the premises after the expiration of this Contract of Lease or termination for any reason whatsoever.</p>

<p>This term of lease is for <strong>${d.leaseTerm}</strong>, from <strong>${d.startDate}</strong> to <strong>${d.endDate}</strong> inclusive. Upon its expiration, this lease may be renewed under such terms and conditions as may be mutually agreed upon by both parties, written notice of intention to renew the lease shall be served to the LESSOR not later than seven (7) days prior to the expiry date of the period herein agreed upon.</p>

<!-- SECTION 2.1 -->
<p class="section-title">2.1 PRE-TERMINATION OF CONTRACT :</p>
<p>Should the LESSEE wish to pre-terminate this Contract of Lease for whatever reason, the LESSEE shall notify the LESSOR in writing at least sixty (60) calendar days in advance of pre-termination date, and shall, simultaneous therewith, pay the LESSOR a pre-termination penalty in an amount equivalent to one (1) month's rental. In the event the sixty (60) calendar day prior notice required above is not complied with, the LESSEE shall be subject to a pre-termination penalty equivalent to not less than three (3) months rental.</p>

<!-- SECTION 3 -->
<p class="section-title">3. RENTAL RATE:</p>
<p>The LESSEE shall pay the LESSOR, for the use and occupancy of the Leased Premises, a monthly rental rate, in Philippine currency, <strong>${monthlyRentWords} (${monthlyRentFmt})</strong> inclusive. All rental payments shall be payable to the LESSOR and paid at the offices of the LESSOR or such other place as the LESSOR may otherwise designate.</p>

<!-- SECTION 3.1 -->
<p class="section-title">3.1 OVERDUE PAYMENT PENALTIES:</p>
<p>Rental payments including incurred penalties shall be made without the necessity of any previous demand or service of a debt collector, it being understood that in case of default, any amount owing shall automatically bear interest at the rate of ${penalty}% per month plus penalty of ${penalty}% per month computed from the due date until fully paid: In addition, LESSEE shall be liable to LESSOR for an additional sum equivalent to twenty five percent (25%) of the rentals due as Attorney's fees in the event of litigation, without prejudice to the LESSOR's right to terminate this contract and to eject the LESSEE as hereinafter set forth;</p>

<p>Further, and in addition to the foregoing, in the event LESSEE incurs in delay in the payment of the rentals for a period of thirty (30) calendar days or more, the LESSOR shall be entitled to summarily cut off all electricity, telephone, water and other utility services to the Leased Premises.</p>

<!-- SECTION 3.2 -->
<p class="section-title">3.2 RENTAL ADJUSTMENTS:</p>
<p>Anything in this Contract to the contrary notwithstanding, if at any time during the term of this lease, there should be a material reduction in the value of the Philippine Peso due to extraordinary inflation or exchange rate depreciation, the rental herein stipulated shall be adjusted in favor of the LESSOR so that such rental shall correspond to the value of the currency at the time this Contract was executed.</p>

<p>It is understood that a &ldquo;material reduction&rdquo; in the value of the currency is deemed to exist when there is a reduction, to the extent of fifteen percent (15%) or less, in the exchange rate of the Philippine Peso vis-&agrave;-vis the U.S. Dollar, as determined by the Banker's Association of the Philippines, compared to the Peso Dollar exchange rate at the time of the commencement of this Contract.</p>

<p>The LESSOR further reserves the right, during the term of this lease, to revise the rent agreed upon in proportion to any increase in real property taxes levied against the land and building during the same calendar year.</p>

<p>It is understood and agreed that in the event of any increases in the rental as provided in the foregoing paragraphs, the LESSEE shall forthwith increase the amount of its security deposit with the LESSOR in proportion to the increase in said rentals.</p>

<!-- SECTION 4 -->
<p class="section-title">4. SECURITY DEPOSIT:</p>
<p>That the LESSEE shall deposit to the LESSOR upon signing of this contract the sum of PESOS: <strong>${secDepWords} (${secDepFmt})</strong> in Philippine Currency, which deposit shall be considered and held by the LESSOR as security for the full and faithful observance and performance by the LESSEE of all the terms, conditions and provisions of this Contract.</p>

<p>In the event of LESSEE's failure to comply with any of the terms and conditions of this Contract, the LESSOR may, at its option, appropriate and apply the said deposit or a part thereof as may be necessary to compensate the LESSOR for whatever expense, loss or damage it may sustain on account of such breach by the LESSEE. The giving of a security to guarantee the payment of rentals falling due after date does not extinguish or novate the obligation to satisfy the same or impair the right of the LESSOR to terminate and/or bring an action for unlawful detainer. Should the entire deposit or any part thereof be appropriated or applied by the LESSOR whether for the payment of rentals in arrears or other sums due and payable to the LESSOR by the LESSEE hereunder, then the LESSEE shall upon written demand by the LESSOR, immediately remit to the LESSOR such amounts as will be sufficient to restore the said deposit to the sum required to be deposited hereunder, and the LESSEE's failure to do so within five (5) calendar days after receipt of such demand shall constitute a breach of this Contract.</p>

<p>If the LESSEE has fully and faithfully complied with all the terms, conditions and provisions hereunder, including the settlements of all amounts due to the LESSOR and all utility bills, common area and other charges accruing up to and when the LESSEE vacates the Leased Premises, said security deposit or any remaining portion thereof, shall be returned to the LESSEE within sixty (60) calendar days after LESSEE has actually and permanently vacated the Leased Premises or until such time that charges for utilities and common area expenses as well as other miscellaneous charges have been determined and applied against the security deposit. It is further understood that the deposit shall not earn any interest whatsoever.</p>

${d.advancePayment > 0 ? `
<!-- ADVANCE PAYMENT -->
<p class="section-title">4.1 ADVANCE PAYMENT</p>
<p>In addition to the security deposit, the LESSEE shall pay the LESSOR upon signing of this contract an advance payment in the amount of <strong>${advWords} (${advFmt})</strong>, which shall be applied to the ${d.advancePayment >= d.monthlyRent ? 'first' : 'last'} month's rental.</p>
` : ''}

<!-- SECTION 5 -->
<p class="section-title">5. DEFAULT PAYMENT:</p>
<p>In case of default by the LESSEE in the payment of the rent, such as when the checks are dishonored, the LESSOR at its option may terminate this contract and eject the LESSEE. The LESSOR has the right to padlock the premises when the LESSEE is in default of payment for One (1) month and may forfeit whatever rental deposit or advances have been given by the LESSEE.</p>

<!-- SECTION 6 -->
<p class="section-title">6. USE OF THE PREMISES:</p>
<p>The Leased Premises shall be used exclusively by the LESSEE for ${d.purpose} purposes only. LESSEE shall not divert the Leased Premises to any other use without the prior written consent of the LESSOR, if it found that the Leased Premises are used for any other purpose, the LESSOR shall have the absolute right to rescind this Contract in accordance with paragraph 29 hereof.</p>

<p>The LESSEE shall take all reasonable precautions to protect the interior of the Leased Premises against damage by storm, typhoon or like threats. The LESSEE shall also see to it that the Leased Premises are used in a manner that will not disturb the peace and tranquility of the other tenants.</p>

<!-- SECTION 6.1 -->
<p class="section-title">6.1 SHADES, AWNINGS, SIGNS, ADVERTISEMENT,ETC:</p>
<p>Shades, awnings, blinds or window guards shall not be installed or used in or about the Lease Premises without the prior written consent of the LESSOR, nor shall any sign, advertisement or notice of any kind be inscribed, painted, affixed or displayed on any of the windows, doors or any part of the outside of the Leased Premises without the prior written consent of the LESSOR first obtained, which consent, however, shall not be unreasonably withheld.</p>

<p>Only the LESSEE of the ground floor office space fronting the road shall be entitled to inscribe, paint, affix or display any such sign, advertisement or notice; provided that such signs, advertisement or notices are placed and limited within the area of the ground floor of the Leased Premises.</p>

<!-- SECTION 6.2 -->
<p class="section-title">6.2 RENOVATIONS, ALTERATIONS, ADDITIONS OR IMPROVEMENTS:</p>
<p>The LESSEE shall not make or introduce any alterations, renovations, improvements or additions to the Leased Premises without first securing the prior written consent of the LESSOR. The LESSOR, further, has the absolute and unqualified right to refuse any request of LESSEE to make or introduce such alterations, additions or any improvements that fail to meet the specifications of or are otherwise unacceptable to the LESSOR. However, the prior consent of the LESSOR shall not relieve the LESSEE from the responsibility of obtaining the relevant permit(s) from the appropriate government agency (cies); neither will it relieve the LESSEE from full compliance with all Building or Fire Codes and Regulations. All expenses for any permit and government inspection fee shall be for the LESSEE's own account. The LESSOR shall have the right to inspect the work during and after completion thereof to assure such compliance.</p>

<p>Upon expiry and/or early termination of this Contract, all fixed and permanent improvements introduced or made on the Leased Premises by the LESSEE shall inure to the benefits of, and become the property of the LESSOR without any need to reimburse the costs thereof to the LESSEE. All fixtures, apparatus and equipment as well as constructions, shelving and the like, which are not permanently attached and which may be removed without damage to the Leased Premises or any part thereof, shall remain the property of the LESSEE, to be removed from the Leased Premises upon the expiry and/or early termination of this Contract without prejudice to the LESSOR's right of retention to defray any and all damage, loss or expenses caused by or unpaid rent due from LESSEE.</p>

<p>The LESSEE shall, at all times, provide the LESSOR and its employees, agents and representatives unhampered access to the lease premises for the purpose of carrying out repairs, maintenance, renovation or repairing works, or of undertaking all works necessary or useful for the preservation, conservation or decoration of the Leased Premises or any part thereof. No compensation or claim shall be allowed to prosper against the LESSOR by reason of any inconvenience, annoyance or injury to the LESSEE's business that may arise by virtue of the LESSOR undertaking any work covered by this provision.</p>

<!-- SECTION 7 -->
<p class="section-title">7. UTILITIES:</p>
<p>The LESSEE shall pay for its own applicable Common Use Area (CUSA) Fees, air conditioning, telex and other utilities and facilities used by it prior to moving out and/or the termination of this Contract.</p>

<p>Payment to utilities shall be made within five (5) calendar days from receipt of the LESSOR's billing without the necessity of any previous demand or service of a collector, it being understood that in case of default, any amount owing shall automatically bear interest at the rate of three percent (3%) per month computed from due date until fully paid.</p>

<p>Furthermore, and in addition to the foregoing, in the event that the LESSEE incurs any delay in the payment of utility charges for a period of thirty (30) calendar days or more, the LESSOR shall be entitled to summarily cut off said utility services and facilities to the Leased Premises, in addition to all the other remedies available to the LESSOR under this contract.</p>

<p>Finally, that the LESSEE shall pay for its own telephone, electric, cable TV, water, Internet, CUSA Fees and other public services and utilities during the duration of the lease and shall provide a copy of all bills to the LESSOR.</p>

<p>Any other amount required to be paid by the LESSEE to the LESSOR hereunder shall, if unpaid on its due date, similarly earn interest at the rate of three percent (3%) per month starting from the date of default. Any amount advanced by the LESSOR for and in behalf of the LESSEE consent, or without such consent if the advance was made by the LESSOR to protect its own interest, shall become due and demandable within five (5) calendar days from the date the LESSEE is notified in writing by the LESSOR to protect its own interest, shall become due and demandable within five (5) calendar days from the date the LESSEE is notified in writing by the LESSOR of such amount advanced by the LESSOR, and shall also earn interest at the rate of three percent (3%) per month such date until the said amount is fully paid and settled.</p>

<p>The LESSEE is NOT entitled to the exclusive use of any of the parking slots in the common area.</p>

<!-- SECTION 7.2 -->
<p class="section-title">7.2 TAXES, LICENCES AND PERMITS:</p>
<p>The LESSEE hereby agrees to pay all charges, taxes, assessments and impositions including VAT, where applicable, which may at any time during the lease period, be imposed or charged by the government authority with respect to the operation of the LESSEE's business on the Leased Premises. The LESSEE shall obtain, in its own name, all licenses and permits required for the lawful operation of its business.</p>

<!-- SECTION 8 -->
<p class="section-title">8. CARE OF EQUIPMENT AND THE LEASED PREMISES:</p>
<p>The LESSEE shall, at its sole expense, maintain the Leased Premises in a clean and sanitary condition, free from obnoxious odors, disturbing noises, or other nuisances. Upon the expiration or earlier termination of this Contract, the LESSEE shall surrender and return the Leased Premises and all its fixtures in good working condition, ordinary wear and tear exempted. The LESSEE shall not drive nails, screws, hooks or other abutments into the walls, frames, ceilings or other portions by the Leased Premises or in any manner deface or damage any part of the Leased Premises.</p>

<p>Any injury or damage to the Leased Premises or any part thereof, caused by the LESSEE, its employees and agents, guests and visitors, shall be repaired or replaced immediately by LESSEE at its own expense; provided that, if the LESSEE fails to do so, the LESSOR may, at its discretion, effect the repair and/or replacement and charge the costs thereof to the LESSEE.</p>

<!-- SECTION 9 -->
<p class="section-title">9. LESSOR'S RIGHT OF ENTRY:</p>
<p>The LESSOR or its authorized agent shall after giving due notice to the LESSEE shall have the right to enter the premises in the presence of the LESSEE or its representative at any reasonable hour to examine the same or make repairs therein or for the operation and maintenance of the building or to exhibit the leased premises to prospective LESSEE, or for any other lawful purposes which it may deem necessary.</p>

<p>Further, the LESSOR's agents and representative shall have the right to enter the Leased Premises at all reasonable hours to inspect and examine the same, or at any time whatsoever necessary, such as in case of fire or other emergencies, for the operation, maintenance and/or protection of the COMPLEX or its installations and during the last six (6) months of the lease, to exhibit the Leased Premises to prospective tenants.</p>

<!-- SECTION 9.1 -->
<p class="section-title">9.1 REPAIR AND MAINTENANCE:</p>
<p>LESSEE shall, at its own expense maintain the Leased Premises in good order and condition. All expenses for replacement of electrical bulbs and for the repair of locks, electrical switches and all other items included in the Leased Premises shall be for the account of the LESSEE. When the Leased Premises are returned, these items must be intact and in good working order.</p>

<p>The LESSEE shall, at all times, provide the LESSOR and it employees and agents, unhampered access to the Leased Premises for the purpose of carrying out repairs, maintenance, renovation or repairing works, or of undertaking all works necessary or useful for the preservation, conservation or decoration of the Leased Premises or any part thereof. No compensation or claim shall be allowed against the LESSOR by reason of any inconvenience, annoyance or injury to the LESSEE's business that may arise by virtue of the LESSOR undertaking any work covered by this provision,</p>

<p>Breakage of glass materials or other breakable items within the Leased Premises caused by the fault or negligence of LESSEE, its agents, employees, guests and visitors shall likewise be for the account of and be paid for by the LESSEE.</p>

<p>Existing electric, plumbing or other service installation in the Leased Premises shall not be tampered with, changed, altered or new installations made without the LESSEE first securing the prior written consent by the LESSOR.</p>

<!-- SECTION 10 -->
<p class="section-title">10. DAMAGE OR DESTRUCTION OF LEASED PREMISES:</p>
<p>Damage to any part of the Leased Premises which may be caused through the malicious or negligent acts of the LESSEE, its employees, agents, guests or visitors or by persons for whose acts the LESSEE is responsible for, shall be the liability of and be paid for by the LESSEE. The repair of the damage caused shall be undertaken by LESSEE through qualified and/or licensed workmen or contractors at LESSEE's expense, and in case of failure of LESSEE to undertake such repairs and restorations immediately, the same shall be charged against and be paid by LESSEE within five (5) calendar days from written demand for payment by the LESSOR.</p>

<p>If the Leased Premises, in whole or part, shall be destroyed or damaged by fire, flood, lightning, typhoon, earthquake, storm, riot or any other unforeseen disabling cause of acts of God, as to render the leased premises during the term substantially unfit for use and occupation of the LESSEE, then this Contract shall ipso facto terminate and LESSOR shall have no further obligation to the LESSEE, and the latter shall immediately vacate and surrender the Leased Premises to the LESSOR. In case of minor damage to the Leased Premises due to fire, earthquake or any cause not attributable to the acts of the LESSEE, its employees, agents, guests or visitors, the LESSOR shall undertake the expeditious repairs of such damage.</p>

<!-- SECTION 11 -->
<p class="section-title">11. AREAS OF INGRESS/EGRESS:</p>
<p>The external sidewalks, entries, alleyways, passages of Condominium shall not be obstructed nor used by the LESSEE for any other purpose than ingress to and egress from the Leased Premises.</p>

<!-- SECTION 12 -->
<p class="section-title">12. GARBAGE RECEPTACLES:</p>
<p>The LESSEE shall provide itself, at its own expense and cost, with receptacles which the Municipal Ordinances may require to hold and contain waste matter, garbage and refuse and shall pay for the garbage fee assessments.</p>

<!-- SECTION 13 -->
<p class="section-title">13. INFLAMMABLE, HAZARDOUS AND EXPLOSIVE MATERIALS:</p>
<p>The LESSEE is prohibited from bringing into and/or storing in the Leased Premises, or any part thereof, any materials or things that is inflammable, explosive or hazardous to public health and safety.</p>

<p>Further, said restriction includes and applies to any apparatus, machinery or equipment (except for those which may ordinarily or reasonably be used or needed by the LESSEE in the pursuit of its business) which may be the cause of obnoxious odors, pollution, tremors or increase the risk of fire or which may tend to increase the insurance rate, or any other articles which the LESSOR may reasonably prohibit, it being understood that should the LESSEE violate this provision, it shall be answerable for all damages caused thereby.</p>

<!-- SECTION 14 -->
<p class="section-title">14. RULES, REGULATIONS, ETC:</p>
<p>The LESSEE shall at all times adhere to and comply with, and shall cause its agents, employees, visitors and guests to likewise adhere and comply with, all rules and regulations promulgated from time to time by the LESSOR or ADMINISTRATOR, and with all the statutes laws, ordinances, rules and regulations promulgated by the duly constituted authorities of the local or National Government relating to the use occupancy, safety and sanitation of the Leased Premises.</p>

<!-- SECTION 15 -->
<p class="section-title">15. COMPLIANCE WITH LAW:</p>
<p>In the conduct of its business, the LESSEE shall comply with all laws, decrees, ordinances, rules and regulations promulgated by the government of the Republic of the Philippines, its subdivision, agencies and instrumentalities and shall indemnify and render the LESSOR free from and harmless against any claims, suits, damage or proceedings arising out of or in connection with any violation thereof.</p>

<!-- SECTION 16 -->
<p class="section-title">16. LIABILITY FOR SUITS, ETC.:</p>
<p>The liable party shall indemnify and hold the other party free from and harmless against any and all actions, suits, damages, liabilities, claims, costs and expenses whatever may arise out of or in connection with the non-compliance by the liable party or any of its agents, employees, guests or customers with the applicable statutes, laws, ordinances, rules and regulations.</p>

<!-- SECTION 17 -->
<p class="section-title">17. INSURANCE:</p>
<p>The LESSEE shall be responsible for obtaining the appropriate insurance coverage on its properties found or located within the Leased Premises.</p>

<!-- SECTION 18 -->
<p class="section-title">18. EXPROPRIATION:</p>
<p>In the event that expropriation proceedings involving or affecting the Leased Premises are instituted during the period of this lease by any instrumentality of the Government or by any other entity with authority to exercise such power, either party may rescind this Contract should the Leased Premises are instituted during the period of this lease by any instrumentality of the Government or by other entity with authority to exercise such power, either party may rescind this contract should the Leased Premises become no longer useful for the purpose of this lease, upon giving the other party thirty (30) days prior written notice thereof. In case of such expropriation, the LESSEE hereby unconditionally and irrevocably relieved and releases the LESSOR from any and all liability under this Contract, without prejudice to whatever recourse the LESSEE may have against the expropriating entity on account of damage done or caused to it or its properties.</p>

<!-- SECTION 19 -->
<p class="section-title">19. SUB-LEASE OR ASSIGNMENT OF LEASE:</p>
<p>The LESSEE shall not directly or indirectly sub-lease, or assign, transfer, convey or in any manner encumber his right of lease over the Leased Premises, or any portion thereof, under any circumstances and in any form whatsoever: Any contract that may be made, or transaction entered into, in violation of this provision shall be null and void. It is expressly understood and agreed by the parties that the business reputation and financial capacity of the LESSEE as herein represented, and the nature of the occupancy of the Leased Premises as above restricted and constituted, are special considerations and inducements for the granting of this lease by the LESSOR; consequently, any against sub-lease and assignment of lease, shall automatically and irrevocably terminate this Contract of Lease from the time such violation occurred.</p>

<p>The LESSOR, however, has the absolute and unrestricted right to assign, transfer or otherwise convey its rights under this Contract in favor of any person, affiliate or subsidiary.</p>

<!-- SECTION 20 -->
<p class="section-title">20. EXTRA ELECTRICAL OUTLETS, ETC:</p>
<p>The installation of additional electric and water connections in the Leased Premises shall be for the account and expense of the LESSEE and shall be made only after obtaining the written consent and approval of the LESSOR.</p>

<!-- SECTION 21 -->
<p class="section-title">21. ADMINISTRATORS:</p>
<p>The LESSEE hereby recognizes the authority of the LESSOR to designate in writing an ADMINISTRATOR or Property manager, who shall act as the LESSOR's representative in all matters related to this Contract of Lease. The LESSEE further recognizes and acknowledges the authority of the appointed administrator in all matters pertaining to this Contract.</p>

<!-- SECTION 22 -->
<p class="section-title">22. LOSS, INJURY OR DAMAGE TO THIRD PARTY:</p>
<p>The LESSEE hereby assumes full and exclusive legal responsibility and liability, for any loss, injury or damage to the Leased Premises itself, its employees, guests, visitors or other individuals, and their respective properties, while remaining either casually or on business in any part of the Leased Premises from any cause whatsoever and further binds itself to indemnify and hold LESSOR free and harmless from any such claim for loss, injury or damage excepting only where such loss, injury or damage is due solely to the negligence or fault of the LESSOR.</p>

<!-- SECTION 23 -->
<p class="section-title">23. LESSOR SHALL NOT BE HELD LIABLE NOR RESPONSIBLE FOR:</p>
<p>For the presence of bugs, vermin, ants, termites and other insects, rodents and pests, if any, in the Leased Premises of their presence;</p>

<p>For the failure of water supply, electric current and/or communicating systems as well as all other utilities and facilities in the Leased Premises due to causes not within the LESSOR's reasonable control;</p>

<p>For any loss, injury or damage caused or occasioned by or arising from bursting or leaking of plumbing, gas, water and/or pipes, or the bursting, leaking or destruction of any cistern, tank, wash stand, water closet, or waste pipe in or about the Leased Premises, nor for any damages arising from the acts or negligence of LESSEE or its agents, employees, representative or any other persons.</p>

<!-- SECTION 24 -->
<p class="section-title">24. RETURN OF LEASED PREMISES AT TERMINATION OF LEASE:</p>
<p>The LESSEE agrees to promptly and peaceably return and surrender the Leased Premises at the expiration of the term of this lease or its earlier termination, as the case may be, in as good condition as reasonable wear and tear will permit and without any delay whatsoever, devoid of all occupants, furniture, articles and effects of any kind other than such properties, alterations, installations, additions or improvements, ownership over which accrues in favor of the LESSOR in accordance with the provisions of this Contract, without prejudice to LESSOR's right of retention to defray any and all damages caused by or unpaid rent due to LESSEE.</p>

<!-- SECTION 25 -->
<p class="section-title">25. BREACH OR DEFAULT:</p>
<p>The LESSEE agrees that all the covenants and stipulations herein contained shall be deemed essential conditions hereof, and that if default or breach be made of any such conditions, the LESSOR shall have the absolute and unrestricted right to terminate and cancel this Contract upon five (5) calendar days written notice delivered at the Leased Premises or posted on the main door thereof, and in such event the LESSEE hereby irrevocably empowers the LESSOR and grants a special power of attorney to the LESSOR, its authorized agents, employees and/or representatives as the LESSEE's duly authorized attorney-in-fact, even after the termination, expiration or cancellation of this Contract, with full powers and authority to open, enter, repossess, secure, encloses, fence, to padlock and prohibit LESSEE from entering the Leased Premises or otherwise take full and complete physical possession and control of the Leased Premises and all its contents without resorting to court action and/or to summarily disconnect electrical, water, telephone and other utility services to the Leased Premises; LESSEE further agrees to pay LESSOR the proportional rent, utilities and common area expenses until such time the LESSEE actually vacates the Leased Premises regardless of the date of termination of the Contract by the LESSOR; LESSEE further irrevocably empowers LESSOR, its authorized agents, employees and representatives to take inventory and possession of whatever equipment, furniture, fixtures, articles, merchandise, etc. found in the Leased Premises belonging to the LESSEE and to place same in LESSOR's custody for safekeeping; charging the LESSEE the corresponding storage fees therefor; that in case LESSEE fails to claim said items from storage and simultaneously liquidate any liability with LESSOR within fifteen (15) calendar days from date of said transfer to LESSOR's custody, LESSOR is likewise hereby expressly authorized and empowered by LESSEE to dispose of said property(ies) in a public sale before a Notary public of LESSOR's choice and to apply the proceeds thereof to whatever liability and/or indebtedness LESSEE may have to LESSOR plus reasonable expenses for the same, including storage fees, and the balance if any, shall be turned over to the LESSEE; that LESSEE hereby expressly agreed that any or all acts performed by LESSOR, its authorized agents, employees and/or representative under the provision of this paragraph may not be the subject of any petition for a writ of preliminary prohibitory or mandatory injunction in court, and that LESSOR and/or its authorized agents, employees and representatives shall be free from any civil and/or criminal liability or responsibility whatsoever therefore.</p>

<p>In case this contract is terminated or cancelled, whether judicially or extra-judicially, by reason of any default or breach committed by the LESSEE, the said LESSEE shall be fully liable to the LESSOR for the damages that is sustained by the latter, actual or consequential, from such default or termination.</p>

<!-- SECTION 26 -->
<p class="section-title">26. JUDICIAL RELIEF:</p>
<p>Should the LESSOR be compelled to seek judicial relief against the LESSEE, the latter shall in addition to any other damages that may be awarded to the LESSOR, pay an amount equivalent to twenty five percent (25%) of the entire amount claimed in the complaint, as and by way of attorney's fees, which amount shall in no case be less than Twenty Thousand pesos (PHP 20,000.00) aside from the costs of litigation and the expenses which the law entitles the LESSOR to recover from the LESSEE.</p>

<!-- SECTION 27 -->
<p class="section-title">27. NO WAIVER:</p>
<p>The failure of the LESSOR to insist upon a strict performance of any of the terms, conditions, stipulations and covenants hereof shall not be deemed a relinquishment or waiver of any right or remedy that LESSOR may have nor shall it be construed as a waiver of any subsequent breach or default of the terms, conditions, stipulations and covenants hereof which shall continue to be in full force and effect. No waiver by the LESSOR of any rights under this Contract shall be deemed to have been made unless expressed in writing and signed by the LESSOR.</p>

<p>All remedies granted to the LESSOR under this Contract or elsewhere shall be deemed cumulative and non-exclusive.</p>

<!-- SECTION 28 -->
<p class="section-title">28. DISCLAIMER OF LIABILITY:</p>
<p>The LESSOR shall not be held liable by the LESSEE in any manner for the failure of electricity or other utilities due to cause beyond the control of LESSOR.</p>

<!-- SECTION 29 -->
<p class="section-title">29. CAPTIONS:</p>
<p>The caption appearing in this Contract are inserted only as a matter of convenience and for reference and in no way define, limit or prescribe the scope and intent of this Contract or any of the provisions hereto.</p>

<!-- SECTION 30 -->
<p class="section-title">30. SEPARABILITY:</p>
<p>The invalidity or unenforceability of any provision hereof shall not affect or impair the other provisions which otherwise can be given full force and effect.</p>

<!-- SECTION 31 -->
<p class="section-title">31. ENTIRE AGREEMENT:</p>
<p>This Contract constitutes the complete and exclusive statement of the terms and conditions of the Contract of Lease between the parties with respect to the subject matter referred to herein. No statement or agreement, oral or written, made prior to the execution hereof, and no prior conduct or practice of either party shall vary or modify the written term and conditions set forth in this contract. No alterations, additions or variations of the terms and conditions of this Contract shall be valid unless made in writing and signed by both parties hereto.</p>

<!-- SECTION 32 -->
<p class="section-title">32. AMENDMENTS:</p>
<p>This Contract may be modified or amended only in writing duly executed by both parties.</p>

<!-- SECTION 33 -->
<p class="section-title">33. NOTICES:</p>
<p>All notices or demands of any kind which LESSOR may be required or may desire to serve on LESSEE under the terms of this lease may be served on LESSEE (as an alternative to personal service) by leaving a copy of such demand or notice at, or by mailing a copy thereof to the Leased Premises. Service shall be deemed complete at the time if the leaving of such notice as aforesaid or within five (5) calendar days from mailing of same. All notices from LESSEE to LESSOR may be served on address as LESSOR may in writing designate to the LESSEE.</p>

<!-- SECTION 34 -->
<p class="section-title">34. STRIKES, LOCKOUTS AND OTHER LABOR DISPUTES:</p>
<p>In the event that, as a result of labor disputes or activities involving the LESSEE's business, a picket line is established upon the Leased Premises or in the vicinity thereof or there is any other activity which , in the judgment of the LESSOR, interferes with or affects the operations of the LESSOR and other lessees, the LESSOR may terminate this contract by advance written notice to the other party, Any extra service contracted by the LESSOR by reasons of such occurrence shall be for the account of the LESSEE.</p>

<!-- SECTION 35 -->
<p class="section-title">35. DISTURBANCE OF POSSESSION:</p>
<p>Disturbance or discontinuance of the LESSEE's possession of the Leased Premises due to causes beyond the reasonable control of the LESSOR shall confer no right of any kind to the LESSEE as against the LESSOR.</p>

<!-- SECTION 36 -->
<p class="section-title">36. ABANDONMENT OF LEASED PREMISES:</p>
<p>In case the Leased Premises shall be abandoned, deserted or vacated before the expiration of this lease, or any of the terms and stipulations hereof be violated, the LESSOR shall have the right to enter the same as agent or attorney-in-fact- of the lessee, and the LESSOR shall furthermore have the option to relet the same to any other party without prejudice to any right of action against the lessee.</p>

<!-- SECTION 37 -->
<p class="section-title">37. JUDICIAL RELIEF:</p>
<p>Should any one of the parties herein be compelled to seek judicial relief against the other, the losing party shall pay an amount of One Hundred (100) % of the amount claimed in the complaint as attorney's fees which shall in no case be less than Fifty Thousand Pesos (Php 50,000.00) in addition to other cost and damages which the said party may be entitled to under the law.</p>

<!-- SECTION 38 -->
<p><br><strong>38.</strong> This CONTRACT OF LEASE shall be valid and binding between the parties, their successors-in-interest and assigns.</p>

<p><br>IN WITNESS WHEREOF, parties herein affixed their signatures on the date and place above written.</p>

<!-- SIGNATURE BLOCKS -->
<table class="sig-table">
  <tr>
    <td style="width:50%;padding-top:60px;">
      <div style="border-top:1px solid #000;display:inline-block;min-width:250px;text-align:center;padding-top:4px;">
        <strong>${d.lessorCompany.toUpperCase()}</strong>
      </div>
      <br><div style="padding-left:40px;">LESSOR</div>
    </td>
    <td style="width:50%;padding-top:60px;text-align:right;">
      <div style="border-top:1px solid #000;display:inline-block;min-width:250px;text-align:center;padding-top:4px;">
        &nbsp;
      </div>
      <br><div style="text-align:right;padding-right:60px;">LESSEE</div>
    </td>
  </tr>
</table>

<p style="margin-top:40px;">By:</p>

<table class="sig-table" style="margin-top:30px;">
  <tr>
    <td style="width:50%;">
      <div style="border-top:1px solid #000;display:inline-block;min-width:250px;text-align:center;padding-top:4px;">
        <strong>${d.lessorRepName}</strong>
      </div>
      <br><div style="padding-left:20px;">${d.lessorRepTitle}</div>
    </td>
    <td style="width:50%;">&nbsp;</td>
  </tr>
</table>

<!-- WITNESSES -->
<div class="witness-block">
  <p>Signed in the presence of:</p>
  <table class="sig-table" style="margin-top:30px;">
    <tr>
      <td style="width:50%;">
        <div style="border-top:1px solid #000;display:inline-block;min-width:200px;text-align:center;padding-top:4px;">
          <strong>${d.witnessName1 || '&nbsp;'}</strong>
        </div>
      </td>
      <td style="width:50%;text-align:right;">
        <div style="border-top:1px solid #000;display:inline-block;min-width:200px;text-align:center;padding-top:4px;">
          <strong>${d.witnessName2 || '&nbsp;'}</strong>
        </div>
      </td>
    </tr>
  </table>
</div>

<!-- ACKNOWLEDGEMENT -->
<div class="ack-block">
  <p class="center"><strong>ACKNOWLEDGEMENT</strong></p>
  <p>Republic of the Philippines)<br>${d.contractLocation}) S.S</p>
  <p>BEFORE ME, personally appeared:</p>
  <table style="width:100%;margin:12px 0;border-collapse:collapse;">
    <tr>
      <td style="padding:4px 8px;width:50%;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Name</td>
      <td style="padding:4px 8px;">Valid ID: TIN</td>
    </tr>
    <tr>
      <td style="padding:4px 8px;">${d.lessorRepName}</td>
      <td style="padding:4px 8px;">TIN Number: ${d.lessorTin || '________________________'}</td>
    </tr>
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #000;">____________________</td>
      <td style="padding:4px 8px;border-bottom:1px solid #000;">________________________</td>
    </tr>
  </table>

  <p>Known to me and to me known to be the same persons who executed the foregoing instrument and acknowledged to me that the same is their free and voluntary act and deed.</p>

  <p>This instrument consisting of 10 pages, including the page on which this acknowledgement is written, has been signed on each and every page thereof by the concerned parties and their witnesses, and sealed with my notarial seal.</p>

  <p>WITNESS MY HAND AND SEAL, on the date and place first above written.</p>

  <br><br>
  <div style="text-align:center;width:250px;margin:0 auto;">
    <div style="border-top:1px solid #000;padding-top:4px"><strong>Notary Public</strong></div>
  </div>
  <br>
  <p>Doc. No. &nbsp;&nbsp;______;<br>Page No. &nbsp;&nbsp;______;<br>Book No. &nbsp;&nbsp;______;<br>Series of &nbsp;&nbsp;______.</p>
</div>

</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function computeLeaseTerm(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const days = end.getDate() - start.getDate();
  if (days > 0) months++;

  if (months >= 12) {
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const yearWord = numberWord(years);
    let result = `${yearWord.toUpperCase()} (${years}) YEAR${years > 1 ? 'S' : ''}`;
    if (rem > 0) {
      const moWord = numberWord(rem);
      result += ` AND ${moWord.toUpperCase()} (${rem}) MONTH${rem > 1 ? 'S' : ''}`;
    }
    return result;
  }
  const moWord = numberWord(months);
  return `${moWord.toUpperCase()} (${months}) MONTH${months > 1 ? 'S' : ''}`;
}

function numberWord(n: number): string {
  const words = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve'];
  return n <= 12 ? words[n] : String(n);
}
