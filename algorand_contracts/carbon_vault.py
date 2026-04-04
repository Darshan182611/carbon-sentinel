from pyteal import *

def approval_program():
    """
    Stateful Smart Contract - The Carbon Vault
    This contract handles the retirement (burning) of Carbon Credit ASAs.
    It permanently locks the token, logging the retirement on the global blockchain state.
    """
    
    # Arguments passed from Node.js
    on_creation = Seq([
        # Initialize total retired counters
        App.globalPut(Bytes("Total_Retired_Tons"), Int(0)),
        Return(Int(1))
    ])

    # The action when the backend calls "retire"
    is_retire_action = Txn.application_args[0] == Bytes("retire")
    
    # We expect an AssetTransfer transaction grouped with this ApplicationCall
    # Group Index 0: App Call
    # Group Index 1: Asset Transfer to the Smart Contract's address (locking it)
    retire_logic = Seq([
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[1].type_enum() == TxnType.AssetTransfer),
        Assert(Gtxn[1].asset_receiver() == Global.current_application_address()),
        
        # Increment the global retired counter by the amount of ASA sent
        App.globalPut(
            Bytes("Total_Retired_Tons"), 
            App.globalGet(Bytes("Total_Retired_Tons")) + Gtxn[1].asset_amount()
        ),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(Int(0))], # Cannot delete
        [Txn.on_completion() == OnComplete.UpdateApplication, Return(Int(0))], # Cannot update
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [is_retire_action, retire_logic]
    )

    return program

def clear_state_program():
    return Return(Int(1))

if __name__ == "__main__":
    # Compile the PyTeal program to TEAL bytecode
    with open("vault_approval.teal", "w") as f:
        compiled_approval = compileTeal(approval_program(), mode=Mode.Application, version=5)
        f.write(compiled_approval)

    with open("vault_clear_state.teal", "w") as f:
        compiled_clear = compileTeal(clear_state_program(), mode=Mode.Application, version=5)
        f.write(compiled_clear)

    print("Smart Contracts successfully compiled to TEAL bytecode (vault_approval.teal and vault_clear_state.teal)!")
