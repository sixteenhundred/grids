"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader, Card, Button, Avatar, MediaTile, Icon, Verified } from "@/components/dashboard/ui";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { useSession } from "@/lib/auth-client";
import { POSTS, findCreative, type Tile } from "@/lib/grid-data";
import {
  loadUserPosts,
  saveUserPosts,
  loadLikes,
  saveLikes,
  relativeTime,
  fileToImageDataUrl,
  type UserPost,
} from "@/lib/community";

const USER_TILE: Tile = { title: "Post", from: "#1f2a40", to: "#0a0c12" };

/* Unified feed item shape (seed posts + user posts). */
type FeedItem = {
  id: string;
  author: string;
  authorId?: string;
  verified: boolean;
  subtitle?: string;
  caption: string;
  tile: Tile;
  image: string | null;
  baseLikes: number;
  comments: number;
  when: string;
};

function seedToFeed(): FeedItem[] {
  return POSTS.map((p) => {
    const c = findCreative(p.by);
    return {
      id: p.id,
      author: c?.name ?? "Creator",
      authorId: p.by,
      verified: !!c?.verified,
      subtitle: c ? `${c.type} · ${c.city}` : undefined,
      caption: p.caption,
      tile: p.image,
      image: null,
      baseLikes: p.likes,
      comments: p.comments,
      when: p.when,
    };
  });
}

function userToFeed(p: UserPost): FeedItem {
  return {
    id: p.id,
    author: p.author,
    verified: false,
    subtitle: "You",
    caption: p.caption,
    tile: USER_TILE,
    image: p.imageUrl,
    baseLikes: 0,
    comments: 0,
    when: relativeTime(p.createdAt),
  };
}

/* Create-post sheet ------------------------------------------------------- */
function CreatePostSheet({ author, onPost }: { author: string; onPost: (p: UserPost) => void }) {
  const { close } = useSheet();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      try {
        setImage(await fileToImageDataUrl(f, 1000));
      } catch {
        /* ignore */
      }
    }
  }

  function submit() {
    onPost({ id: `up${Date.now()}`, author, caption: caption.trim(), imageUrl: image, createdAt: Date.now() });
    close();
  }

  return (
    <div>
      <SheetHeader title="New post" subtitle="Share work or an update with the network." />
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative mb-4 flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-aerial-cyan/50 hover:bg-white/[0.05]"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Post" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-white/45">
            <Icon name="camera" size={22} />
            <span className="text-xs">Add a photo (optional)</span>
          </span>
        )}
      </button>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={3}
        autoFocus
        placeholder="What did you shoot?"
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-aerial-cyan/50"
      />
      <div className="mt-6">
        <Button full arrow disabled={!caption.trim() && !image} onClick={submit}>
          Post
        </Button>
      </div>
    </div>
  );
}

/* Interactive post card --------------------------------------------------- */
function PostItem({ item, liked, onToggleLike }: { item: FeedItem; liked: boolean; onToggleLike: () => void }) {
  const likes = item.baseLikes + (liked ? 1 : 0);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar id={item.authorId} name={item.author} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white">{item.author}</span>
            {item.verified && <Verified size={13} className="text-grid-blue" />}
          </div>
          {item.subtitle && <span className="block truncate text-xs text-white/50">{item.subtitle}</span>}
        </div>
        <span className="shrink-0 text-xs text-white/40">{item.when}</span>
      </div>
      <MediaTile tile={item.tile} image={item.image} ratio="3 / 2" rounded="rounded-none" />
      <div className="p-4">
        <p className="text-sm leading-relaxed text-white/75">
          <span className="font-medium text-white">{item.author.split(" ")[0]}</span> {item.caption}
        </p>
        <div className="mt-3 flex items-center gap-5 text-white/50">
          <button
            type="button"
            onClick={onToggleLike}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-urgent-red" : "hover:text-white"}`}
          >
            <Icon name="heart" size={16} /> {likes}
          </button>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Icon name="comment" size={16} /> {item.comments}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function CommunityPage() {
  const { open } = useSheet();
  const { data } = useSession();
  const authorName = data?.user?.name ?? "You";
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [likes, setLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUserPosts(loadUserPosts());
    setLikes(new Set(loadLikes()));
  }, []);

  function addPost(p: UserPost) {
    const next = [p, ...userPosts];
    setUserPosts(next);
    saveUserPosts(next);
  }
  function toggleLike(id: string) {
    setLikes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveLikes([...next]);
      return next;
    });
  }

  const feed: FeedItem[] = [...userPosts.map(userToFeed), ...seedToFeed()];

  return (
    <div className="flex flex-col gap-8">
      <div className="rise flex items-end justify-between gap-4">
        <PageHeader
          eyebrow="Community"
          tone="cyan"
          title="From the network."
          subtitle="Work and updates from creatives on Grid."
        />
        <Button tone="cyan" arrow onClick={() => open(<CreatePostSheet author={authorName} onPost={addPost} />)}>
          New post
        </Button>
      </div>

      <div className="rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "60ms" }}>
        {feed.map((item) => (
          <PostItem key={item.id} item={item} liked={likes.has(item.id)} onToggleLike={() => toggleLike(item.id)} />
        ))}
      </div>
    </div>
  );
}
