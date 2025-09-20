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
import { CreateSharedExpenseDto } from "./dto/create-shared-expense.dto";
import { SplitEquallyDto } from "./dto/split-equally.dto";
import { SettlementConfirmationDto } from "./dto/settlement-confirmation.dto";
import { SettlementPreviewDto } from "./dto/settlement-preview.dto";

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

  @Post(":id/expenses")
  @ApiOperation({ summary: "Create a shared expense" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiBody({ type: CreateSharedExpenseDto })
  @ApiResponse({
    status: 201,
    description: "Shared expense created successfully",
    schema: {
      example: {
        success: true,
        data: {
          id: "expense_id",
          amount: 100.00,
          description: "Dinner at restaurant",
          date: "2024-01-15T19:30:00.000Z",
          payerId: "user_id",
          groupId: "group_id",
          payer: {
            id: "user_id",
            name: "John Doe",
            email: "john@example.com"
          },
          splits: [
            {
              id: "split_id",
              userId: "user_id",
              amount: 50.00
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Invalid expense data or split configuration"
  })
  async createSharedExpense(
    @Param("id") id: string,
    @Body() createSharedExpenseDto: CreateSharedExpenseDto,
    @Request() req
  ) {
    const expense = await this.groupsService.createSharedExpense(
      id,
      createSharedExpenseDto,
      req.user.id
    );
    return {
      success: true,
      data: expense,
      message: "Shared expense created successfully"
    };
  }

  @Get(":id/expenses")
  @ApiOperation({ summary: "Get all shared expenses for a group" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Shared expenses retrieved successfully"
  })
  async getSharedExpenses(@Param("id") id: string, @Request() req) {
    const expenses = await this.groupsService.getSharedExpenses(id, req.user.id);
    return {
      success: true,
      data: expenses
    };
  }

  @Get(":id/expenses/:expenseId")
  @ApiOperation({ summary: "Get shared expense by ID" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiParam({ name: "expenseId", description: "Expense ID" })
  @ApiResponse({
    status: 200,
    description: "Shared expense retrieved successfully"
  })
  @ApiResponse({
    status: 404,
    description: "Shared expense not found or access denied"
  })
  async getSharedExpenseById(
    @Param("id") id: string,
    @Param("expenseId") expenseId: string,
    @Request() req
  ) {
    const expense = await this.groupsService.getSharedExpenseById(
      expenseId,
      req.user.id
    );
    return {
      success: true,
      data: expense
    };
  }

  @Get(":id/balances")
  @ApiOperation({ summary: "Get member balances for a group" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Group balances retrieved successfully",
    schema: {
      example: {
        success: true,
        data: [
          {
            id: "balance_id",
            userId: "user_id",
            groupId: "group_id",
            balance: 25.50,
            user: {
              id: "user_id",
              name: "John Doe",
              email: "john@example.com"
            }
          }
        ]
      }
    }
  })
  async getGroupBalances(@Param("id") id: string, @Request() req) {
    const balances = await this.groupsService.getGroupBalances(id, req.user.id);
    return {
      success: true,
      data: balances
    };
  }

  @Post(":id/split-equally")
  @ApiOperation({ summary: "Perform equal split settlement (Admin only)" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiBody({ type: SplitEquallyDto })
  @ApiResponse({
    status: 200,
    description: "Equal split settlement completed successfully"
  })
  @ApiResponse({
    status: 403,
    description: "Only group admins can perform settlements"
  })
  async splitEqually(
    @Param("id") id: string,
    @Body() splitEquallyDto: SplitEquallyDto,
    @Request() req
  ) {
    const result = await this.groupsService.splitEqually(
      id,
      splitEquallyDto,
      req.user.id
    );
    return result;
  }

  @Get(":id/settlements")
  @ApiOperation({ summary: "Get settlement history for a group" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiResponse({
    status: 200,
    description: "Settlement history retrieved successfully"
  })
  async getSettlements(@Param("id") id: string, @Request() req) {
    const settlements = await this.groupsService.getSettlements(id, req.user.id);
    return {
      success: true,
      data: settlements
    };
  }

  @Post(":id/settlement-preview")
  @ApiOperation({ summary: "Preview settlement calculation (Admin only)" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiBody({ type: SettlementPreviewDto })
  @ApiResponse({
    status: 200,
    description: "Settlement preview calculated successfully",
    schema: {
      example: {
        success: true,
        data: {
          totalBalance: 100.00,
          equalShare: 33.33,
          participantCount: 3,
          settlementPreview: [
            {
              user: {
                id: "user_id",
                name: "John Doe",
                email: "john@example.com"
              },
              currentBalance: 50.00,
              targetBalance: 33.33,
              adjustment: -16.67,
              willOwe: 16.67,
              willReceive: 0
            }
          ],
          summary: {
            totalOwed: 33.34,
            totalToReceive: 33.34
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: "Only group admins can preview settlements"
  })
  async previewSettlement(
    @Param("id") id: string,
    @Body() settlementPreviewDto: SettlementPreviewDto,
    @Request() req
  ) {
    const preview = await this.groupsService.previewSettlement(
      id,
      settlementPreviewDto,
      req.user.id
    );
    return {
      success: true,
      data: preview
    };
  }

  @Post(":id/execute-settlement")
  @ApiOperation({ summary: "Execute settlement with confirmation (Admin only)" })
  @ApiParam({ name: "id", description: "Group ID" })
  @ApiBody({ type: SettlementConfirmationDto })
  @ApiResponse({
    status: 200,
    description: "Settlement executed successfully",
    schema: {
      example: {
        success: true,
        message: "Settlement executed successfully",
        data: {
          settlements: [
            {
              id: "settlement_id",
              fromId: "user1",
              toId: "user2",
              amount: 16.67,
              groupId: "group_id",
              createdAt: "2024-01-01T00:00:00.000Z",
              from: {
                id: "user1",
                name: "John Doe",
                email: "john@example.com"
              }
            }
          ],
          updatedBalances: [
            {
              id: "balance_id",
              userId: "user1",
              groupId: "group_id",
              balance: 33.33,
              user: {
                id: "user1",
                name: "John Doe",
                email: "john@example.com"
              }
            }
          ],
          summary: {
            totalBalance: 100.00,
            equalShare: 33.33,
            participantCount: 3,
            settlementsCreated: 2
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: "Settlement must be confirmed or invalid data"
  })
  @ApiResponse({
    status: 403,
    description: "Only group admins can execute settlements"
  })
  async executeSettlement(
    @Param("id") id: string,
    @Body() settlementConfirmationDto: SettlementConfirmationDto,
    @Request() req
  ) {
    const result = await this.groupsService.executeSettlement(
      id,
      settlementConfirmationDto,
      req.user.id
    );
    return result;
  }
}
