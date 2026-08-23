export type FaqItem = { q: string; a: string[] };


/**
 * The FAQ content and the FAQPage JSON-LD are generated from this one array,
 * so the markup and the visible answers cannot drift apart.
 *
 * ⚠️ These are regulatory claims on a public page. Nothing here ships without
 * review; see the spec's "nothing regulatory ships unreviewed". Answers are
 * kept to what is stated in Regulation (EU) 2023/1115 as amended, plus what
 * Grovetrace itself does; where a date or threshold is involved it is stated
 * plainly rather than paraphrased, and readers are pointed at their own
 * counsel for their own scope.
 */
export const FAQ: FaqItem[] = [
  {
    q: 'Does the December 2026 deadline actually apply to me?',
    a: [
      'It depends on your size, and the two cohorts have different dates. <strong>Large and medium operators and traders</strong> are in scope from <strong>30 December 2026</strong>. <strong>Small and micro enterprises</strong> follow on <strong>30 June 2027</strong>.',
      'If you place cocoa, coffee, palm oil, soy, rubber, cattle or wood, or products derived from them, on the EU market, or export them from it, the regulation is aimed at you. Which cohort you sit in is a question for your own counsel; it turns on your company size, not on your volume of any one commodity.',
    ],
  },
  {
    q: 'What counts as geolocation for a smallholder farm?',
    a: [
      'A <strong>point</strong> is sufficient for a plot below 4 hectares. Above that you need a <strong>polygon</strong> describing the plot boundary.',
      'This is the detail that quietly breaks cocoa programmes. A co-op collecting points for every farm is fine right up until a farm turns out to be 4.2 ha, and then the point that was collected two seasons ago is not the evidence you need. Grovetrace validates geometry on the way in, checking validity, hemisphere and range, duplicates and overlaps, so the gaps surface months before a submission window rather than inside one.',
    ],
  },
  {
    q: 'Do I have to replace the systems I already use?',
    a: [
      'No, and you should not have to. Grovetrace connects to what you run: ERP exports, field-data platforms, co-op spreadsheets, CSV. It maps each source once onto its own model: farmers to suppliers, plots to land plots, lots to batches.',
      'That matters most at origin. A cooperative in Ghana is not going to adopt your compliance software, so the data has to be ingested in whatever shape it already arrives in.',
    ],
  },
  {
    q: 'Our plot data arrives in four different formats. Is that a problem?',
    a: [
      'That is the normal case, and it is the specific problem Grovetrace was built for. Each source gets its own mapping, so thirty origins sending thirty conventions still resolve to one set of suppliers, plots and batches.',
      'The harder half is identity: the ERP has a vendor code, the field tool has a farmer ID, and the co-op spreadsheet is keyed on a name spelled three ways. Grovetrace resolves those to one supplier and one plot rather than leaving you to reconcile them per shipment.',
    ],
  },
  {
    q: 'What about blending? Our lots come from many farms.',
    a: [
      'Aggregation is modelled explicitly rather than flattened. Beans from many farms become one lot, one container, one shipment, and the link from each batch back to the batches that fed it is kept, so a filed statement can still name every plot behind a blended consignment.',
      'Traceability that survives the blend is the difference between a statement you can defend and one you hope is not examined.',
    ],
  },
  {
    q: 'What happens if TRACES rejects a statement?',
    a: [
      'The rejection and its reason are recorded against the statement, and the shipment returns to the worklist as something to act on rather than disappearing into an inbox. You fix the underlying data and resubmit.',
      'Most rejections trace back to the same few fields being absent or imprecise, which is why the product spends its effort upstream of the filing.',
    ],
  },
  {
    q: 'Is this only for cocoa?',
    a: [
      'The platform is commodity-generic. All seven EUDR commodities work the same way, and running cocoa and coffee through one compliance function rather than two is a common reason people come to us.',
      'Cocoa is where the depth is, because cocoa is where the hard parts concentrate: thousands of smallholder plots, co-ops in the middle of the chain, and aggregation before export.',
    ],
  },
  {
    q: 'How far along is Grovetrace?',
    a: [
      'Early, and stated plainly: the platform is working software running against the <strong>TRACES acceptance environment</strong>, the EU\'s pre-production system, and it is not yet a finished product with a list of reference customers.',
      'That is the trade. A design partner gets founder-level access, real influence over what gets built, and co-development pricing, in exchange for working with something still being shaped. If you need a finished product today, we are not the right fit yet, and saying so early saves us both a quarter.',
    ],
  },
];

/**
 * `faqPageLd` takes one plain string per answer, while the rendered answers are
 * paragraphs carrying a little inline markup. Project one from the other so the
 * structured data and the visible text can never disagree.
 */
export function faqPlainText(item: FaqItem): string {
  return item.a.join(' ').replace(/<[^>]+>/g, '');
}
