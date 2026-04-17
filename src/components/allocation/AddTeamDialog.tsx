import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users } from 'lucide-react';

interface AddTeamDialogProps {
  projectId: string;
  projectName?: string;
  trigger?: React.ReactNode;
  onCreate: (projectId: string, payload: { name: string; description?: string }) => Promise<void> | void;
}

export function AddTeamDialog({ projectId, projectName, trigger, onCreate }: AddTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamName, setTeamName] = useState('New Squad');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teamName.trim()) {
      setError('Please provide a team name.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onCreate(projectId, {
        name: teamName.trim(),
        description: description.trim() || undefined,
      });
      setOpen(false);
      setTeamName('New Squad');
      setDescription('');
      setError(null);
    } catch (err) {
      console.error('Add team failed:', err);
      setError('Unable to create team right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 gap-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-300 hover:text-indigo-600">
            <Plus className="w-3 h-3" />
            New Squad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] bg-white text-gray-900 border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create squad</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {projectName ? `${projectName}: ` : ''}Add a new delivery squad to receive allocations from the organisation pool.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="team-name">
              Squad name
            </label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(event) => {
                setTeamName(event.target.value);
                setError(null);
              }}
              placeholder="e.g. Growth Engineering"
              className="border-gray-300 focus-visible:ring-indigo-500"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="team-description">
              Mission statement (optional)
            </label>
            <Textarea
              id="team-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what this squad owns across the project."
              className="border-gray-300 focus-visible:ring-indigo-500 min-h-[90px]"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="w-3.5 h-3.5" />
              Squads help organise allocations and AI recommendations.
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-700">
                {isSubmitting ? 'Creating…' : 'Create squad'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
