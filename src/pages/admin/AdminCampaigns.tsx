import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, { fieldInputClass, fieldSelectClass } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/Toast";

function toDateTimeInput(value?: number) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toTimestamp(value: string) {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export default function AdminCampaigns() {
  const campaignsQuery = useQuery(api.campaigns.adminList);
  const segments = useQuery(api.segments.adminList) ?? [];
  const templates = useQuery(api.campaigns.listTemplates, {}) ?? [];
  const createCampaign = useMutation(api.campaigns.adminCreate);
  const startRun = useMutation(api.campaigns.startRun);
  const completeRun = useMutation(api.campaigns.completeRun);
  const createTemplate = useMutation(api.campaigns.createTemplate);
  const updateDeliveryStatus = useMutation(api.notifications.adminUpdateJobStatus);
  const retryDeliveryJob = useMutation(api.notifications.adminRetryJob);
  const { toast } = useToast();

  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const runs = useQuery(
    api.campaigns.listRuns,
    selectedCampaignId ? { campaign_id: selectedCampaignId as any } : {}
  ) ?? [];
  const [selectedRunId, setSelectedRunId] = useState("");
  const jobs = useQuery(
    api.campaigns.listJobs,
    selectedRunId ? { run_id: selectedRunId as any, limit: 200 } : { limit: 80 }
  ) ?? [];

  const [opsChannelFilter, setOpsChannelFilter] = useState("");
  const [opsStatusFilter, setOpsStatusFilter] = useState("");
  const [opsSearch, setOpsSearch] = useState("");
  const [selectedDeliveryJobId, setSelectedDeliveryJobId] = useState("");
  const [opsBusyKey, setOpsBusyKey] = useState<string | null>(null);

  const deliveryJobs =
    useQuery(api.notifications.adminDeliveryOverview, {
      run_id: selectedRunId ? (selectedRunId as any) : undefined,
      channel: opsChannelFilter || undefined,
      status: opsStatusFilter || undefined,
      search: opsSearch.trim() || undefined,
      limit: 120,
    }) ?? [];
  const deliveryLogs =
    useQuery(
      api.notifications.adminListJobLogs,
      selectedDeliveryJobId ? { job_id: selectedDeliveryJobId as any, limit: 60 } : "skip"
    ) ?? [];

  const [campaignName, setCampaignName] = useState("");
  const [campaignChannel, setCampaignChannel] = useState("email");
  const [campaignStatus, setCampaignStatus] = useState("draft");
  const [campaignSegment, setCampaignSegment] = useState("");
  const [campaignTemplate, setCampaignTemplate] = useState("");
  const [campaignSchedule, setCampaignSchedule] = useState("");
  const [campaignCreating, setCampaignCreating] = useState(false);

  const [templateKey, setTemplateKey] = useState("");
  const [templateChannel, setTemplateChannel] = useState("email");
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateVariables, setTemplateVariables] = useState("");
  const [templateCreating, setTemplateCreating] = useState(false);

  const sortedCampaigns = useMemo(
    () => [...(campaignsQuery ?? [])].sort((a: any, b: any) => b.updated_at - a.updated_at),
    [campaignsQuery]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          className="bg-white border border-[#111]/10 p-6 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!campaignName.trim()) {
              toast("Campaign name is required", "error");
              return;
            }
            setCampaignCreating(true);
            try {
              await createCampaign({
                name: campaignName.trim(),
                channel: campaignChannel,
                status: campaignStatus,
                segment_id: campaignSegment ? (campaignSegment as any) : undefined,
                template_id: campaignTemplate ? (campaignTemplate as any) : undefined,
                schedule_at: toTimestamp(campaignSchedule),
                config: {},
              });
              setCampaignName("");
              setCampaignSegment("");
              setCampaignTemplate("");
              setCampaignSchedule("");
              setCampaignStatus("draft");
              setCampaignChannel("email");
              toast("Campaign created");
            } catch (error: any) {
              toast(error?.message ?? "Unable to create campaign", "error");
            } finally {
              setCampaignCreating(false);
            }
          }}
        >
          <h2 className="font-display text-xl">Create Campaign</h2>
          <FormField label="Name" required>
            <input
              className={fieldInputClass}
              value={campaignName}
              onChange={(event) => setCampaignName(event.target.value)}
              required
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Channel">
              <select
                className={fieldSelectClass}
                value={campaignChannel}
                onChange={(event) => setCampaignChannel(event.target.value)}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select
                className={fieldSelectClass}
                value={campaignStatus}
                onChange={(event) => setCampaignStatus(event.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
              </select>
            </FormField>
          </div>
          <FormField label="Segment">
            <select
              className={fieldSelectClass}
              value={campaignSegment}
              onChange={(event) => setCampaignSegment(event.target.value)}
            >
              <option value="">All users</option>
              {segments.map((segment: any) => (
                <option key={segment._id} value={segment._id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Template">
            <select
              className={fieldSelectClass}
              value={campaignTemplate}
              onChange={(event) => setCampaignTemplate(event.target.value)}
            >
              <option value="">No template selected</option>
              {templates
                .filter((template: any) => template.channel === campaignChannel)
                .map((template: any) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Schedule At">
            <input
              className={fieldInputClass}
              type="datetime-local"
              value={campaignSchedule}
              onChange={(event) => setCampaignSchedule(event.target.value)}
            />
          </FormField>
          <button className="btn-primary w-full" disabled={campaignCreating}>
            {campaignCreating ? "Creating..." : "Create Campaign"}
          </button>
        </form>

        <form
          className="bg-white border border-[#111]/10 p-6 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!templateKey.trim() || !templateName.trim() || !templateBody.trim()) {
              toast("Template key, name, and body are required", "error");
              return;
            }
            setTemplateCreating(true);
            try {
              await createTemplate({
                key: templateKey.trim().toLowerCase(),
                channel: templateChannel,
                name: templateName.trim(),
                subject: templateSubject.trim() || undefined,
                body: templateBody,
                variables: templateVariables
                  .split(/[\n,]+/)
                  .map((value) => value.trim())
                  .filter(Boolean),
                active: true,
              });
              setTemplateKey("");
              setTemplateName("");
              setTemplateBody("");
              setTemplateSubject("");
              setTemplateVariables("");
              setTemplateChannel("email");
              toast("Template created");
            } catch (error: any) {
              toast(error?.message ?? "Unable to create template", "error");
            } finally {
              setTemplateCreating(false);
            }
          }}
        >
          <h2 className="font-display text-xl">Create Template</h2>
          <FormField label="Template Key" required>
            <input
              className={fieldInputClass}
              value={templateKey}
              onChange={(event) => setTemplateKey(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Channel">
            <select
              className={fieldSelectClass}
              value={templateChannel}
              onChange={(event) => setTemplateChannel(event.target.value)}
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </FormField>
          <FormField label="Name" required>
            <input
              className={fieldInputClass}
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Subject">
            <input
              className={fieldInputClass}
              value={templateSubject}
              onChange={(event) => setTemplateSubject(event.target.value)}
            />
          </FormField>
          <FormField label="Body" required>
            <textarea
              className={`${fieldInputClass} min-h-24`}
              value={templateBody}
              onChange={(event) => setTemplateBody(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Variables" hint="Comma/newline separated placeholders">
            <input
              className={fieldInputClass}
              value={templateVariables}
              onChange={(event) => setTemplateVariables(event.target.value)}
              placeholder="first_name, order_number"
            />
          </FormField>
          <button className="btn-primary w-full" disabled={templateCreating}>
            {templateCreating ? "Creating..." : "Create Template"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <section className="bg-white border border-[#111]/10 p-6 space-y-3">
          <h2 className="font-display text-lg">Campaigns</h2>
          {sortedCampaigns.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No campaigns created.</p>
          ) : (
            sortedCampaigns.map((campaign: any) => (
              <article
                key={campaign._id}
                className={`border p-3 space-y-2 ${
                  selectedCampaignId === campaign._id
                    ? "border-[#D4A05A]"
                    : "border-[#111]/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="text-left"
                    onClick={() => {
                      setSelectedCampaignId(campaign._id);
                      setSelectedRunId("");
                    }}
                  >
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {campaign.channel} • {campaign.status} • runs {campaign.run_count}
                    </p>
                    {campaign.schedule_at ? (
                      <p className="text-xs text-[#6E6E6E]">
                        Scheduled: {new Date(campaign.schedule_at).toLocaleString()}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="text-xs border border-[#111]/10 px-2 py-1"
                      onClick={async () => {
                        try {
                          const runId = await startRun({ campaign_id: campaign._id });
                          setSelectedCampaignId(campaign._id);
                          setSelectedRunId(String(runId));
                          toast("Campaign run started");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to start campaign run", "error");
                        }
                      }}
                    >
                      Start
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="bg-white border border-[#111]/10 p-6 space-y-3">
          <h2 className="font-display text-lg">Campaign Runs</h2>
          {!selectedCampaignId ? (
            <p className="text-sm text-[#6E6E6E]">Select a campaign to inspect runs.</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No runs for this campaign.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run: any) => (
                <article
                  key={run._id}
                  className={`border p-3 space-y-2 ${
                    selectedRunId === run._id ? "border-[#D4A05A]" : "border-[#111]/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button className="text-left" onClick={() => setSelectedRunId(run._id)}>
                      <p className="text-sm font-medium">
                        {run.status} • recipients {run.recipient_count ?? 0}
                      </p>
                      <p className="text-xs text-[#6E6E6E]">
                        Started {toDateTimeInput(run.started_at || run.created_at)}
                      </p>
                      <p className="text-xs text-[#6E6E6E]">
                        Success {run.success_count ?? 0} • Failed {run.failure_count ?? 0}
                      </p>
                    </button>
                    {run.status !== "completed" ? (
                      <button
                        className="text-xs border border-[#111]/10 px-2 py-1"
                        onClick={async () => {
                          try {
                            await completeRun({ run_id: run._id });
                            toast("Run completed");
                          } catch (error: any) {
                            toast(error?.message ?? "Unable to complete run", "error");
                          }
                        }}
                      >
                        Complete
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}

          {selectedRunId ? (
            <div className="pt-3 border-t border-[#111]/10 space-y-2">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
                Notification Jobs
              </p>
              {jobs.length === 0 ? (
                <p className="text-sm text-[#6E6E6E]">No jobs for this run.</p>
              ) : (
                jobs.map((job: any) => (
                  <div key={job._id} className="border border-[#111]/10 p-2 text-xs">
                    <p className="font-medium">{job.status}</p>
                    <p className="text-[#6E6E6E]">
                      {job.channel} • {job.guest_contact || job.user_id || "unknown recipient"}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </section>
      </div>

      <section className="bg-white border border-[#111]/10 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg">Delivery Operations</h2>
            <p className="text-xs text-[#6E6E6E]">
              Queue control and status overrides for notification jobs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              className="border border-[#111]/10 px-3 py-2 text-xs bg-white"
              value={opsSearch}
              onChange={(event) => setOpsSearch(event.target.value)}
              placeholder="Search recipient, template, campaign"
            />
            <select
              className={fieldSelectClass}
              value={opsChannelFilter}
              onChange={(event) => setOpsChannelFilter(event.target.value)}
            >
              <option value="">All channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <select
              className={fieldSelectClass}
              value={opsStatusFilter}
              onChange={(event) => setOpsStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {deliveryJobs.length === 0 ? (
          <p className="text-sm text-[#6E6E6E]">No delivery jobs match this view.</p>
        ) : (
          <div className="space-y-2">
            {deliveryJobs.map((job: any) => (
              <article
                key={job._id}
                className={`border p-3 space-y-2 ${
                  selectedDeliveryJobId === job._id ? "border-[#D4A05A]" : "border-[#111]/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <button
                    className="text-left"
                    onClick={() => setSelectedDeliveryJobId(String(job._id))}
                  >
                    <p className="text-sm font-medium">
                      {job.template_name || job.template_key || "Notification"}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      {job.channel} â€¢ {job.recipient}
                      {job.campaign_name ? ` â€¢ ${job.campaign_name}` : ""}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      Status {job.status} â€¢ retries {job.retries ?? 0}
                    </p>
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="text-xs border border-[#111]/10 px-2 py-1"
                      disabled={opsBusyKey === `retry:${job._id}`}
                      onClick={async () => {
                        setOpsBusyKey(`retry:${job._id}`);
                        try {
                          await retryDeliveryJob({ job_id: job._id });
                          toast("Job requeued");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to requeue job", "error");
                        } finally {
                          setOpsBusyKey(null);
                        }
                      }}
                    >
                      Requeue
                    </button>
                    <button
                      className="text-xs border border-emerald-200 text-emerald-700 px-2 py-1"
                      disabled={opsBusyKey === `sent:${job._id}`}
                      onClick={async () => {
                        setOpsBusyKey(`sent:${job._id}`);
                        try {
                          await updateDeliveryStatus({
                            job_id: job._id,
                            status: "sent",
                            event: "admin_marked_sent",
                          });
                          toast("Job marked sent");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to update job", "error");
                        } finally {
                          setOpsBusyKey(null);
                        }
                      }}
                    >
                      Mark Sent
                    </button>
                    <button
                      className="text-xs border border-red-200 text-red-600 px-2 py-1"
                      disabled={opsBusyKey === `failed:${job._id}`}
                      onClick={async () => {
                        setOpsBusyKey(`failed:${job._id}`);
                        try {
                          await updateDeliveryStatus({
                            job_id: job._id,
                            status: "failed",
                            event: "admin_marked_failed",
                          });
                          toast("Job marked failed");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to update job", "error");
                        } finally {
                          setOpsBusyKey(null);
                        }
                      }}
                    >
                      Mark Failed
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedDeliveryJobId ? (
          <div className="pt-3 border-t border-[#111]/10 space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Delivery Logs</p>
            {deliveryLogs.length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No logs for this job.</p>
            ) : (
              deliveryLogs.map((log: any) => (
                <div key={log._id} className="border border-[#111]/10 p-2 text-xs">
                  <p className="font-medium">{log.event}</p>
                  <p className="text-[#6E6E6E]">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
