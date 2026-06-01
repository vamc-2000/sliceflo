import Image from "next/image";
import TeamDiscussionEmpty from "@/public/images/teams/TeamDiscussionEmpty.svg";

const EmptyTeamDiscussion = () => {
  return (
    <div className="flex items-center justify-center min-h-100">
      <Image
        src={TeamDiscussionEmpty}
        alt="Team Discussion Empty"
        width={700} 
        height={700} 
        className="object-contain"
      />
    </div>
  );
};

export default EmptyTeamDiscussion;