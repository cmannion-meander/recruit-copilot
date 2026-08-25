from common.refusals import Refusal


class SignalRefused(Refusal):
    """A resolve/override guard: an empty note, an empty reason, or a signal that is
    already closed."""
