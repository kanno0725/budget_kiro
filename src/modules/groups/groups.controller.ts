import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GroupsService } from "./groups.service";
import { CreateGroupDto } from "./dto/create-group.dto";
import { JoinGroupDto } from "./dto/join-group.dto";
import { UpdateMemberRoleDto } from "./dto/update-member-role.dto";

@ApiTags("Groups")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new group" })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: 201,
    description: "Group created successfully",
    schema: {
      example: {
        success: true,
        data: {
          id: "group_id",
          name: "Family Budget",
          inviteCode: "abc123def456",
          createdAt: "2024-01-01T00:00:00.000Z",
          members: [
            {
              id: "member_id",
              role: "ADMIN",
              user: {
                id: "user_id",
                name: "John Doe",
                email: "john@example.com",
              },
            },
          ],
        },
      },
    },
  })
  async create(@Body() createGroupDto: CreateGroupDto, @Request() req) {
    const group = await this.groupsService.create(createGroupDto, req.user.id);
    return {
      success: true,
      data: group,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get all groups for current user" })
  @ApiResponse({
    status: 200,
    description: "List of groups retrieved successfully",
    schema: {
      example: {
        success: true,
        data: [
          {
            id: "group_id",
            name: "Family Budget",
            inviteCode: "abc123def456",
            createdAt: "2024-01-01T00:00:00.000Z",
            members: [],
            _count: {
              members: 3,
              sharedExpenses: 5,
            },
          },
        ],
      },
    },
  })
  async findAll(@Request() req) {
    const groups = await this.groupsService.findAll(req.user.id);
    return {
      success: true,
      data: groups,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get group by ID" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Group retrieved successfully",
  })
  @ApiResponse({
    status: 404,
    description: "Group not found or access denied",
  })
  async findOne(@Param("id") id: string, @Request() req) {
    const group = await this.groupsService.findOne(id, req.user.id);
    return {
      success: true,
      data: group,
    };
  }

  @Post("join")
  @ApiOperation({ summary: "Join a group using invite code" })
  @ApiBody({ type: JoinGroupDto })
  @ApiResponse({
    status: 200,
    description: "Successfully joined group",
  })
  @ApiResponse({
    status: 404,
    description: "Invalid invite code",
  })
  @ApiResponse({
    status: 409,
    description: "Already a member of this group",
  })
  async joinGroup(
    @Body() joinGroupDto: JoinGroupDto,
    @Request() req,
    @Res() res
  ) {
    const group = await this.groupsService.joinGroup(joinGroupDto, req.user.id);
    return res.status(200).json({
      success: true,
      data: group,
      message: "Successfully joined group",
    });
  }

  @Get(":id/members")
  @ApiOperation({ summary: "Get all members of a group" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Group members retrieved successfully",
  })
  async getMembers(@Param("id") id: string, @Request() req) {
    const members = await this.groupsService.getMembers(id, req.user.id);
    return {
      success: true,
      data: members,
    };
  }

  @Put(":id/members/:memberId/role")
  @ApiOperation({ summary: "Update member role (Admin only)" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiParam({ name: "memberId", description: "Member ID" })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({
    status: 200,
    description: "Member role updated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only group admins can update member roles",
  })
  async updateMemberRole(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    @Request() req
  ) {
    const member = await this.groupsService.updateMemberRole(
      id,
      memberId,
      updateMemberRoleDto,
      req.user.id
    );
    return {
      success: true,
      data: member,
      message: "Member role updated successfully",
    };
  }

  @Delete(":id/members/:memberId")
  @ApiOperation({ summary: "Remove member from group (Admin only)" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiParam({ name: "memberId", description: "Member ID" })
  @ApiResponse({
    status: 200,
    description: "Member removed successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only group admins can remove members",
  })
  async removeMember(
    @Param("id") id: string,
    @Param("memberId") memberId: string,
    @Request() req
  ) {
    const result = await this.groupsService.removeMember(
      id,
      memberId,
      req.user.id
    );
    return result;
  }

  @Post(":id/leave")
  @ApiOperation({ summary: "Leave a group" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Left group successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Cannot leave group as the only admin",
  })
  async leaveGroup(@Param("id") id: string, @Request() req, @Res() res) {
    const result = await this.groupsService.leaveGroup(id, req.user.id);
    return res.status(200).json(result);
  }

  @Post(":id/regenerate-invite")
  @ApiOperation({ summary: "Regenerate group invite code (Admin only)" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Invite code regenerated successfully",
  })
  @ApiResponse({
    status: 403,
    description: "Only group admins can regenerate invite codes",
  })
  async regenerateInviteCode(
    @Param("id") id: string,
    @Request() req,
    @Res() res
  ) {
    const result = await this.groupsService.regenerateInviteCode(
      id,
      req.user.id
    );
    return res.status(200).json({
      success: true,
      data: result,
      message: "Invite code regenerated successfully",
    });
  }
}
