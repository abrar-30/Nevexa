import { PostCard } from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Post } from "@/lib/posts-api";
import React from "react";

interface PostsListProps {
  posts: Post[];
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  currentUserId: string;
  onCreatePost?: () => void;
}

export function PostsList({ posts, onLike, onComment, currentUserId, onCreatePost }: PostsListProps) {
  const filteredPosts = posts
    .filter(post => post.user)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return (
    <div className="space-y-6">
      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={onLike}
            onComment={onComment}
            currentUserId={currentUserId}
          />
        ))
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No posts to show</p>
            {onCreatePost && (
              <Button onClick={onCreatePost}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first post
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 