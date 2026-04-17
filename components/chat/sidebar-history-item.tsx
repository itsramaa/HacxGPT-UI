import Link from "next/link";
import { memo, useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Chat } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { MoreHorizontalIcon, TrashIcon, PencilEditIcon } from "./icons";
import { getChatHistoryPaginationKey } from "./sidebar-history";

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { mutate } = useSWRConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibilityType: chat.visibility,
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    if (!newTitle.trim() || newTitle === chat.title) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/sessions/${chat.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim() }),
        }
      );

      if (!response.ok) throw new Error("Failed to rename chat");

      toast.success("Chat renamed");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      mutate(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/messages?chatId=${chat.id}`);
    } catch (error) {
      toast.error("Failed to rename chat");
      setNewTitle(chat.title);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="h-8 rounded-none text-[13px] text-sidebar-foreground/50 transition-all duration-150 hover:bg-transparent hover:text-sidebar-foreground data-active:bg-transparent data-active:font-normal data-active:text-sidebar-foreground/50 data-[active=true]:text-sidebar-foreground data-[active=true]:font-medium data-[active=true]:border-b data-[active=true]:border-dashed data-[active=true]:border-sidebar-foreground/50"
        isActive={isActive}
      >
        {isEditing ? (
          <div className="flex w-full items-center px-0">
            <input
              ref={inputRef}
              className="w-full bg-transparent outline-none text-sidebar-foreground font-medium"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setNewTitle(chat.title);
                }
              }}
            />
          </div>
        ) : (
          <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
            <span className="truncate">
              {chat.title === "New Chat" ? (
                <span className="flex items-center gap-1.5 italic opacity-40 animate-pulse font-normal">
                  Generating title...
                </span>
              ) : (
                chat.title
              )}
            </span>
          </Link>
        )}
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="mr-0.5 rounded-md text-sidebar-foreground/50 ring-0 transition-colors duration-150 focus-visible:ring-0 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <PencilEditIcon />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => onDelete(chat.id)}
            variant="destructive"
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) { return false; }
  if (prevProps.chat.title !== nextProps.chat.title) { return false; }
  if (prevProps.chat.visibility !== nextProps.chat.visibility) { return false; }
  return true;
});
