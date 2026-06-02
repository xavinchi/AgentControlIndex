import EditorialCard from '../components/ui/EditorialCard'
import DenseTable from '../components/ui/DenseTable'
import methodologyWeights from '../../public/data/methodologyWeights.json'

export default function MethodologyPage() {
  return (
    <section className="space-y-6">
      <EditorialCard eyebrow="Framework Note" title="Methodology & Scoring Model">
        <p>
          This benchmark framework is governance-led and designed for structured comparison of agent control tooling.
          Current values are prototype sample data and should not be treated as factual ratings.
        </p>
      </EditorialCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <EditorialCard title="Inclusion Rules">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Primary product function must include agent control, governance, observability, security, or policy enforcement.</li>
            <li>Tool must have publicly reviewable evidence such as documentation, demos, case studies, or control mappings.</li>
            <li>Capability must be material to enterprise deployment, not only a generic productivity feature.</li>
          </ul>
        </EditorialCard>

        <EditorialCard title="Exclusion Rules">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>General-purpose tools with no explicit governance or runtime-control capability.</li>
            <li>Products lacking minimum evidence signals for verification.</li>
            <li>Duplicate listings where multiple entries represent the same tool edition without distinct control behavior.</li>
          </ul>
        </EditorialCard>
      </div>

      <EditorialCard title="Score Dimensions">
        <p className="text-sm">
          Each tool is scored from <span className="font-medium">0 to 5</span> across eight dimensions, then weighted to a
          total score out of 100. Dimension definitions prioritize practical governance outcomes over feature volume for
          enterprise decision-making.
        </p>
      </EditorialCard>

      <EditorialCard title="Methodology Table">
        <DenseTable
          headers={['Dimension', 'Weight', 'Scoring Intent']}
          rows={methodologyWeights.dimensions.map((dimension) => [
            dimension.label,
            `${dimension.weight}%`,
            dimension.key === 'runtimePolicyControl'
              ? 'Quality of runtime policy definition, enforcement, and exception control.'
              : dimension.key === 'identityAccessPermissions'
                ? 'Strength of identity model, permission boundaries, and access governance.'
                : dimension.key === 'observabilityAuditability'
                  ? 'Depth of traceability, logging, audit records, and forensic usefulness.'
                  : dimension.key === 'riskComplianceGovernance'
                    ? 'Coverage of risk controls, compliance mapping, and governance workflows.'
                    : dimension.key === 'humanOversightApprovals'
                      ? 'Human-in-the-loop approvals, overrides, and escalation pathways.'
                      : dimension.key === 'toolActionControl'
                        ? 'Granularity of action controls, constraints, and execution boundaries.'
                        : dimension.key === 'enterpriseIntegrationReadiness'
                          ? 'Integration fit with enterprise systems and operational environments.'
                          : 'Evidence quality, maturity signals, and repeatability confidence.'
          ])}
        />
      </EditorialCard>

      <div className="grid gap-6 xl:grid-cols-2">
      <EditorialCard title="Weighting Model">
        <p className="text-sm">
          Weighted Score = sum of (<span className="font-medium">dimension score / 5</span>) x dimension weight. The model
          emphasizes runtime policy and governance-critical controls while keeping evidence quality as a distinct factor.
        </p>
          <p className="mt-2 text-sm">
            Score Bands: Leader (85-100), Strong Performer (70-84), Emerging Contender (55-69), Early Stage (40-54),
            Limited Evidence (0-39).
          </p>
        </EditorialCard>

        <EditorialCard title="Evidence Hierarchy">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Independent validation and customer-usable proof.</li>
            <li>Detailed technical documentation and control mappings.</li>
            <li>Vendor claims without verifiable supporting material.</li>
          </ol>
        </EditorialCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EditorialCard title="Confidence Levels">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>High: multiple strong sources, recent review, and cross-source consistency.</li>
            <li>Medium: partial supporting evidence with moderate recency or depth.</li>
            <li>Low: sparse, outdated, or claim-heavy evidence.</li>
          </ul>
        </EditorialCard>

        <EditorialCard title="Update Cadence">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>Quarterly scheduled refresh of scores and evidence references.</li>
            <li>Ad hoc updates for major product, policy, or regulatory changes.</li>
            <li>Each update should log reviewer, date, and evidence delta.</li>
          </ul>
        </EditorialCard>
      </div>

      <EditorialCard title="Limitations">
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Current dataset is sample-only and intended for product prototyping.</li>
          <li>Comparisons may be sensitive to evidence availability rather than true capability parity.</li>
          <li>Scores do not replace formal procurement due diligence, security review, or legal assessment.</li>
        </ul>
      </EditorialCard>
    </section>
  )
}
