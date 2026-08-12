import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as announcementsApi from '../../api/announcements';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Field, Input, Select, Textarea } from '../../components/ui/FormFields';

const AUDIENCE_LABELS = {
  whole_school: 'Whole School',
  staff_only: 'Staff Only',
  class: 'Class',
};

const CAN_POST_ROLES = ['proprietor', 'principal', 'bursar', 'exam_officer', 'teacher'];

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AnnouncementsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const canPost = hasRole(CAN_POST_ROLES);

  const feedQuery = useQuery({ queryKey: ['announcements'], queryFn: announcementsApi.getAnnouncements });

  const composeOptionsQuery = useQuery({
    queryKey: ['announcements-compose-options'],
    queryFn: announcementsApi.getComposeOptions,
    enabled: canPost,
  });

  const markReadMutation = useMutation({
    mutationFn: announcementsApi.markAnnouncementRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', audience: '', include_parents: true, notify_by_email: true });
  const [error, setError] = useState(null);

  const audiences = composeOptionsQuery.data?.audiences ?? [];
  const isClassTeacherPost = audiences.length === 1 && audiences[0] === 'class';

  const postMutation = useMutation({
    mutationFn: () =>
      announcementsApi.postAnnouncement({
        title: form.title,
        body: form.body,
        audience: isClassTeacherPost ? 'class' : form.audience,
        include_parents: isClassTeacherPost ? form.include_parents : undefined,
        notify_by_email: form.notify_by_email,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowComposer(false);
      setForm({ title: '', body: '', audience: '', include_parents: true, notify_by_email: true });
      setError(null);
    },
    onError: (err) => setError(err.response?.data?.message ?? 'Could not post announcement.'),
  });

  function handleOpenItem(item) {
    if (!item.is_read) markReadMutation.mutate(item.id);
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Updates from your school."
        action={
          canPost && (
            <Button onClick={() => setShowComposer((v) => !v)}>
              {showComposer ? 'Cancel' : '+ New Announcement'}
            </Button>
          )
        }
      />

      <div className="p-4 md:p-8 max-w-3xl">
        {canPost && showComposer && (
          <Card className="mb-6">
            {audiences.length === 0 ? (
              <p className="text-sm text-muted">
                {composeOptionsQuery.data?.message ?? 'You are not able to post announcements right now.'}
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  postMutation.mutate();
                }}
              >
                {error && <p className="text-sm text-danger mb-4">{error}</p>}

                <Field label="Title">
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </Field>

                <Field label="Message">
                  <Textarea
                    required
                    rows={4}
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                  />
                </Field>

                {isClassTeacherPost ? (
                  <>
                    <p className="text-xs text-muted mb-3">
                      Posting to <strong>{composeOptionsQuery.data.school_class_name}</strong>
                    </p>
                    <label className="flex items-center gap-2 text-sm text-ink mb-4">
                      <input
                        type="checkbox"
                        checked={form.include_parents}
                        onChange={(e) => setForm({ ...form, include_parents: e.target.checked })}
                      />
                      Also notify parents
                    </label>
                  </>
                ) : (
                  <Field label="Audience">
                    <Select
                      required
                      value={form.audience}
                      onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    >
                      <option value="" disabled>Select an audience…</option>
                      {audiences.map((a) => (
                        <option key={a} value={a}>{AUDIENCE_LABELS[a]}</option>
                      ))}
                    </Select>
                  </Field>
                )}

                <label className="flex items-center gap-2 text-sm text-ink mb-4">
                  <input
                    type="checkbox"
                    checked={form.notify_by_email}
                    onChange={(e) => setForm({ ...form, notify_by_email: e.target.checked })}
                  />
                  Also email everyone who can see this
                </label>

                <Button type="submit" disabled={postMutation.isPending}>
                  {postMutation.isPending ? 'Posting…' : 'Post Announcement'}
                </Button>
              </form>
            )}
          </Card>
        )}

        <div className="space-y-3">
          {feedQuery.isLoading && <p className="text-sm text-muted">Loading…</p>}
          {feedQuery.data?.announcements.length === 0 && (
            <Card><p className="text-sm text-muted text-center py-6">No announcements yet.</p></Card>
          )}
          {feedQuery.data?.announcements.map((item) => (
            <Card
              key={item.id}
              className={`cursor-pointer transition-colors ${!item.is_read ? 'border-primary/40' : ''}`}
            >
              <div onClick={() => handleOpenItem(item)}>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    {!item.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                  </div>
                  <span className="text-xs text-muted whitespace-nowrap">{timeAgo(item.created_at)}</span>
                </div>
                <p className="text-sm text-ink/80 whitespace-pre-wrap mb-2">{item.body}</p>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span>{item.posted_by}</span>
                  <span>&middot;</span>
                  <Badge tone="primary">
                    {item.school_class ? item.school_class : AUDIENCE_LABELS[item.audience]}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
