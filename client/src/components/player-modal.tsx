import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: string;
  teamType: 'home' | 'away';
}

export default function PlayerModal({ isOpen, onClose, gameId, teamType }: PlayerModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    jerseyNumber: '',
    name: '',
    position: '',
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/players", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', gameId, 'players'] });
      toast({
        title: "Player Added",
        description: "Player has been added successfully",
      });
      setFormData({ jerseyNumber: '', name: '', position: '' });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.jerseyNumber.trim() || !formData.position) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createPlayerMutation.mutate({
      gameId,
      teamType,
      jerseyNumber: parseInt(formData.jerseyNumber),
      name: formData.name.trim(),
      position: formData.position,
      kills: 0,
      assists: 0,
      digs: 0,
      blocks: 0,
      aces: 0,
      errors: 0,
    });
  };

  const handleClose = () => {
    setFormData({ jerseyNumber: '', name: '', position: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Jersey Number</Label>
            <Input
              type="number"
              placeholder="#"
              value={formData.jerseyNumber}
              onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
              className="w-full focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Player Name</Label>
            <Input
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Position</Label>
            <Select
              value={formData.position}
              onValueChange={(value) => setFormData({ ...formData, position: value })}
            >
              <SelectTrigger className="w-full focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Outside Hitter">Outside Hitter</SelectItem>
                <SelectItem value="Setter">Setter</SelectItem>
                <SelectItem value="Middle Blocker">Middle Blocker</SelectItem>
                <SelectItem value="Opposite Hitter">Opposite Hitter</SelectItem>
                <SelectItem value="Libero">Libero</SelectItem>
                <SelectItem value="Defensive Specialist">Defensive Specialist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={createPlayerMutation.isPending}
              className="flex-1 bg-primary text-white hover:bg-blue-700"
            >
              {createPlayerMutation.isPending ? "Adding..." : "Save Player"}
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
