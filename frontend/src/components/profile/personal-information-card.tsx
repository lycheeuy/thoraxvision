"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UpdateUserRequest, UserResponse } from "@/lib/api/types";

export interface PersonalInformationCardProps {
  user: UserResponse;
  onSave: (data: UpdateUserRequest) => Promise<void>;
  saving?: boolean;
}

export function PersonalInformationCard({ user, onSave, saving = false }: PersonalInformationCardProps) {
  const [fullName, setFullName] = useState<string>(user.full_name ?? "");
  const [email, setEmail] = useState<string>(user.email);

  const handleSubmit = async () => {
    await onSave({
      full_name: fullName.trim() === "" ? null : fullName.trim(),
      email: email.trim(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">Personal Information</CardTitle>
        <p className="text-sm text-muted-foreground">Update your name and email address.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={saving}
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}